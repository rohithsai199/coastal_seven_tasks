import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.ai.rag_service import rag_service
from app.ai.llm_providers import PROVIDERS
from app.ai.fallback_orchestrator import stream_orchestrated_chat, get_fallback_chain
from app.ai.langchain_pipeline import LangChainRAGWorkflow
from app.ai.moderation import moderate_text, ModerationResult
from app.ai.cache import get_cached_ai_response, set_cached_ai_response, get_ai_cache_stats
from app.ai.description_generator import (
    ProductDescriptionRequest,
    ProductDescriptionResponse,
    generate_product_description,
)
from app.models import User
from app.dependencies import require_admin
from app.ai.semantic_search import perform_semantic_search
from app.ai.agent import AIAgentOrchestrator, TOOL_SCHEMAS
from app.ai.governance import AIGovernanceService
from app.tasks.ai_tasks import (
    async_reindex_catalogue_task,
    async_generate_description_task,
    async_audit_quota_usage_task,
)
from app.utils.rate_limiter import ai_limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Shopping Assistant"])


class ChatMessageItem(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Customer question or product inquiry")
    history: Optional[List[ChatMessageItem]] = Field(default=[], description="Previous conversation turns")
    provider: Optional[str] = Field(default=None, description="Preferred LLM provider (groq, gemini, mistral, or auto)")
    api_key: Optional[str] = Field(default=None, description="Optional custom provider API key")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of catalogue products to retrieve")


class ModerationCheckRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Content to moderate")


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Customer inquiry for AI agent")
    provider: Optional[str] = Field(default=None)
    api_key: Optional[str] = Field(default=None)


@router.post("/chat/stream")
@ai_limiter.limit("40/minute")
async def chat_stream(
    request: Request,
    payload: AIChatRequest,
    db: Session = Depends(get_db),
):
    """
    Streaming AI Chat endpoint powered by Server-Sent Events (SSE).
    Orchestrates:
    - Content moderation checks
    - RAG retrieval via ChromaDB
    - Prompt engineering
    - Multi-provider fallback (Groq -> Gemini -> Mistral -> Catalogue Engine)
    - Per-user rate limiting
    """
    # 1. Content Moderation Check
    moderation: ModerationResult = moderate_text(payload.query)
    if moderation.flagged:
        async def flagged_stream():
            warning_payload = {
                "content": f"⚠️ Content Policy Notice: Your inquiry was flagged for {moderation.reason or 'safety reasons'}. Please rephrase your query without instruction overrides or inappropriate language."
            }
            yield f"event: delta\ndata: {json.dumps(warning_payload)}\n\n"
            yield f"event: done\ndata: {json.dumps({'status': 'flagged', 'reason': moderation.reason})}\n\n"

        return StreamingResponse(
            flagged_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Content-Type": "text/event-stream"}
        )

    # 2. Auto-sync ChromaDB if empty on first request
    if rag_service.collection.count() == 0:
        try:
            rag_service.sync_all_products(db)
        except Exception as e:
            logger.warning(f"Auto-sync of products into ChromaDB failed: {e}")

    history_dicts = [item.model_dump() for item in payload.history] if payload.history else []

    generator = stream_orchestrated_chat(
        query=payload.query,
        history=history_dicts,
        preferred_provider=payload.provider,
        custom_api_key=payload.api_key,
        top_k=payload.top_k,
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream",
        },
    )


@router.post("/chat")
@ai_limiter.limit("30/minute")
async def chat_json(
    request: Request,
    response: Response,
    payload: AIChatRequest,
    db: Session = Depends(get_db),
):
    """
    Non-streaming synchronous AI chat endpoint with Redis response caching.
    Repeated queries return instant cached responses to reduce latency & token costs.
    """
    # 1. Moderation Check
    moderation = moderate_text(payload.query)
    if moderation.flagged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content flagged: {moderation.reason}"
        )

    # 2. Redis Cache Lookup
    cache_params = {
        "q": payload.query.strip().lower(),
        "provider": payload.provider or "auto",
        "top_k": payload.top_k,
    }
    cached_res = get_cached_ai_response("chat_response", cache_params)
    if cached_res:
        cached_res["cached"] = True
        try:
            AIGovernanceService.record_usage(provider=payload.provider or "groq", cached=True)
        except Exception as ex:
            logger.debug(f"Governance record cache error: {ex}")
        return cached_res

    if rag_service.collection.count() == 0:
        rag_service.sync_all_products(db)

    history_dicts = [item.model_dump() for item in payload.history] if payload.history else []

    generator = stream_orchestrated_chat(
        query=payload.query,
        history=history_dicts,
        preferred_provider=payload.provider,
        custom_api_key=payload.api_key,
        top_k=payload.top_k,
    )

    full_text = []
    citations = []
    metadata = {}

    async for sse_chunk in generator:
        for line in sse_chunk.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                data_str = line[6:]
                try:
                    data = json.loads(data_str)
                    if "sources" in data:
                        citations = data["sources"]
                    elif "content" in data:
                        full_text.append(data["content"])
                    elif "provider" in data:
                        metadata = data
                except Exception:
                    pass

    response_payload = {
        "answer": "".join(full_text).strip(),
        "citations": citations,
        "metadata": metadata,
        "query": payload.query,
        "cached": False,
    }

    # Store in Redis (15 mins TTL)
    set_cached_ai_response("chat_response", cache_params, response_payload, ttl_seconds=900)
    return response_payload


@router.get("/semantic-search")
@ai_limiter.limit("60/minute")
def semantic_search_endpoint(
    request: Request,
    response: Response,
    q: str = Query(..., min_length=2, max_length=150, description="Semantic search query"),
    limit: int = Query(10, ge=1, le=50),
    min_score: float = Query(0.35, ge=0.0, le=1.0),
    max_price: Optional[float] = Query(None, ge=0),
    in_stock_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    """
    Intelligent semantic & vector similarity search across product catalogue.
    Finds products based on contextual meaning and intent (e.g. 'comfortable shoes for running')
    backed by ChromaDB embeddings and Redis caching.
    """
    return perform_semantic_search(
        db=db,
        query=q,
        limit=limit,
        min_score=min_score,
        max_price=max_price,
        in_stock_only=in_stock_only,
    )


@router.post("/generate-description", response_model=ProductDescriptionResponse)
@ai_limiter.limit("20/minute")
async def generate_product_description_endpoint(
    request: Request,
    response: Response,
    payload: ProductDescriptionRequest,
):
    """
    AI-powered automated product description and marketing copy generator.
    Generates high-converting titles, short hooks, long descriptions, bullet points,
    and SEO keywords with automatic fallback.
    """
    res = await generate_product_description(payload)
    try:
        AIGovernanceService.record_usage(
            provider=res.provider_used or "groq",
            prompt_tokens=150,
            completion_tokens=300,
        )
    except Exception as ex:
        logger.debug(f"Governance record description error: {ex}")
    return res


@router.post("/moderate", response_model=ModerationResult)
def moderate_content_endpoint(
    request: Request,
    payload: ModerationCheckRequest,
):
    """
    AI Content moderation API for user-generated content, comments, and inquiries.
    """
    return moderate_text(payload.text)


@router.post("/agent/chat")
@ai_limiter.limit("30/minute")
def agent_chat_endpoint(
    request: Request,
    response: Response,
    payload: AgentChatRequest,
    db: Session = Depends(get_db),
):
    """
    AI Agent endpoint featuring tool calling & function execution:
    - Search catalog with filters
    - Retrieve order status and fulfillment
    - Check warehouse inventory
    - Lookup active promotions & discount codes
    """
    res = AIAgentOrchestrator.execute_agent_workflow(
        db=db,
        user_message=payload.message,
        preferred_provider=payload.provider,
        api_key=payload.api_key,
    )
    try:
        provider_used = res.get("provider", "groq") if isinstance(res, dict) else "groq"
        AIGovernanceService.record_usage(
            provider=provider_used,
            prompt_tokens=220,
            completion_tokens=180,
        )
    except Exception as ex:
        logger.debug(f"Governance record agent error: {ex}")
    return res


@router.post("/reindex")
def reindex_catalogue(db: Session = Depends(get_db)):
    """
    Reindexes all products from relational database into ChromaDB vector store.
    """
    total = rag_service.sync_all_products(db)
    return {
        "status": "success",
        "message": f"Successfully reindexed {total} products in ChromaDB.",
        "total_indexed": total,
    }


@router.get("/status")
def ai_status():
    """
    Comprehensive diagnostic health and capability status of AI subsystem:
    - Vector store stats
    - Configured providers & fallback order
    - Redis cache stats
    - Agent tool schemas
    - Content moderation configuration
    """
    vector_stats = rag_service.get_stats()
    cache_stats = get_ai_cache_stats()

    providers_status = {}
    for key, p in PROVIDERS.items():
        is_cfg = p.is_configured()
        providers_status[key] = {
            "name": p.name,
            "configured": is_cfg,
            "default_model": p.default_model,
        }

    return {
        "status": "online",
        "vector_store": vector_stats,
        "providers": providers_status,
        "fallback_order": get_fallback_chain(),
        "cache": cache_stats,
        "agent_tools": TOOL_SCHEMAS,
        "moderation_enabled": True,
        "rate_limiting": "per-user JWT + client IP tiered",
        "governance": {
            "target_spend": "$0.00",
            "policy": "Strict Free-Tier LLM Routing",
            "active_quotas": "Groq + Gemini + Mistral Free Tiers",
        },
    }


@router.get("/governance")
def get_ai_governance_report(current_user: User = Depends(require_admin)):
    """
    Responsible AI & Cost Governance metrics endpoint.
    Protected: Accessible exclusively by store administrators.
    Reports real-time free-tier quota consumption, remaining requests,
    commercial savings, and guarantees $0 API spend.
    """
    return AIGovernanceService.get_governance_report()


@router.post("/tasks/audit-quotas", status_code=status.HTTP_202_ACCEPTED)
def async_audit_quotas_task_endpoint(current_user: User = Depends(require_admin)):
    """
    Dispatches asynchronous Celery background task for AI quota tracking & governance audit.
    Protected: Accessible exclusively by store administrators.
    """
    task = async_audit_quota_usage_task.delay()
    return {
        "task_id": task.id,
        "status": "PENDING",
        "message": "Responsible AI quota and cost audit queued in Celery worker.",
    }


@router.post("/tasks/reindex", status_code=status.HTTP_202_ACCEPTED)
def async_reindex_catalogue_task_endpoint(current_user: User = Depends(require_admin)):
    """
    Dispatches asynchronous Celery background task for full catalogue vectorization.
    Offloads heavy document chunking and embedding operations from HTTP request loop.
    Returns Celery task_id for tracking progress.
    """
    task = async_reindex_catalogue_task.delay()
    return {
        "task_id": task.id,
        "status": "PENDING",
        "message": "Catalogue vectorization and reindexing queued in Celery worker.",
    }


@router.post("/tasks/generate-description", status_code=status.HTTP_202_ACCEPTED)
def async_generate_description_task_endpoint(payload: ProductDescriptionRequest):
    """
    Dispatches asynchronous Celery background task for AI product description generation.
    """
    task = async_generate_description_task.delay(
        product_name=payload.name,
        category=payload.category,
        features=payload.features,
        tone=payload.tone,
        target_audience=payload.target_audience,
    )
    return {
        "task_id": task.id,
        "status": "PENDING",
        "message": f"AI description generation queued in Celery worker for '{payload.name}'.",
    }


@router.get("/langchain/test")
def test_langchain_workflow(q: str = "headphones", db: Session = Depends(get_db)):
    """
    Demonstrates LangChain fundamentals and chain workflow execution.
    """
    if rag_service.collection.count() == 0:
        rag_service.sync_all_products(db)

    result = LangChainRAGWorkflow.execute(q)
    return {
        "query": q,
        "citations_count": len(result["citations"]),
        "context_preview": result["context"][:300] + "...",
        "citations": result["citations"],
        "langchain_messages_count": len(result["messages"]),
    }
