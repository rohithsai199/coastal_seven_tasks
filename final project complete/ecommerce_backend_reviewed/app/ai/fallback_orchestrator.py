import json
import logging
from typing import AsyncGenerator, List, Dict, Any, Optional

from app.config import settings
from app.ai.llm_providers import PROVIDERS, BaseLLMProvider
from app.ai.rag_service import rag_service
from app.ai.prompt_engineering import build_openai_messages, is_greeting_or_conversational
from app.ai.governance import AIGovernanceService

logger = logging.getLogger(__name__)


def get_fallback_chain(preferred_provider: Optional[str] = None) -> List[str]:
    """
    Constructs the fallback order.
    Order prioritizes Gemini, followed by other external providers, ending with the resilient local catalogue fallback.
    """
    all_known = ["gemini", "groq", "mistral"]
    chain: List[str] = []

    # If preferred provider requested and exists, put it first
    if preferred_provider and preferred_provider in PROVIDERS:
        chain.append(preferred_provider)

    # Add other external providers if not already added (Gemini first)
    for p in all_known:
        if p not in chain:
            chain.append(p)

    # Always anchor with the smart catalogue fallback
    if "catalogue_fallback" not in chain:
        chain.append("catalogue_fallback")

    return chain


async def stream_orchestrated_chat(
    query: str,
    history: Optional[List[Dict[str, str]]] = None,
    preferred_provider: Optional[str] = None,
    custom_api_key: Optional[str] = None,
    top_k: int = 4
) -> AsyncGenerator[str, None]:
    """
    High-availability streaming generator using RAG retrieval, prompt engineering,
    dynamic fallback chain, and SSE formatting.
    """
    # 1. Determine Intent: Greeting / Small Talk vs Product Inquiry
    is_greeting = is_greeting_or_conversational(query)

    if is_greeting:
        context_text = ""
        citations = []
    else:
        # RAG Retrieval from ChromaDB strictly for product inquiries
        context_text, citations = rag_service.retrieve(query, top_k=top_k)

    # 2. Prompt Engineering: Inject context into structured OpenAI-compatible messages
    messages = build_openai_messages(
        question=query,
        context=context_text,
        history=history,
        is_greeting=is_greeting
    )

    # 3. Determine Fallback Chain
    fallback_chain = get_fallback_chain(preferred_provider)

    attempted_providers: List[str] = []
    successful_provider: Optional[str] = None
    fallback_occurred = False

    # 4. Only emit citations event if this was a product inquiry with actual relevant items
    if citations:
        citations_event = {
            "sources": citations,
            "query": query,
        }
        yield f"event: citations\ndata: {json.dumps(citations_event)}\n\n"

    # 5. Iterate through providers in fallback chain
    for idx, provider_key in enumerate(fallback_chain):
        provider: BaseLLMProvider = PROVIDERS.get(provider_key)
        if not provider:
            continue

        # Check if configured (unless it's the fallback engine)
        is_ready = provider.is_configured(custom_key=custom_api_key if idx == 0 else None)
        if not is_ready:
            attempted_providers.append(f"{provider_key} (unconfigured/missing API key)")
            continue

        attempted_providers.append(provider_key)
        if idx > 0 and preferred_provider and preferred_provider != provider_key:
            fallback_occurred = True

        try:
            logger.info(f"Attempting inference via provider: {provider_key}")

            # Send metadata header event for the active provider
            meta_event = {
                "provider": provider.name,
                "model": provider.default_model,
                "fallback_used": fallback_occurred,
                "attempted_providers": attempted_providers,
                "citations_count": len(citations),
            }
            yield f"event: metadata\ndata: {json.dumps(meta_event)}\n\n"

            # Stream chunks from provider
            stream_gen = provider.stream_chat(
                messages=messages,
                custom_key=custom_api_key if idx == 0 else None,
            )

            has_yielded = False
            total_generated_chars = 0
            async for chunk in stream_gen:
                if chunk:
                    has_yielded = True
                    total_generated_chars += len(chunk)
                    delta_payload = {"content": chunk}
                    yield f"event: delta\ndata: {json.dumps(delta_payload)}\n\n"

            if has_yielded:
                successful_provider = provider_key
                try:
                    est_prompt = max(40, len(query.split()) * 4 + (len(context_text.split()) if context_text else 0))
                    est_comp = max(20, total_generated_chars // 4)
                    AIGovernanceService.record_usage(
                        provider=provider_key,
                        prompt_tokens=est_prompt,
                        completion_tokens=est_comp,
                        cached=False,
                    )
                except Exception as ex:
                    logger.debug(f"AIGovernanceService record_usage note: {ex}")
                break
            else:
                logger.warning(f"Provider {provider_key} yielded no content, triggering next fallback...")
                fallback_occurred = True

        except Exception as e:
            logger.warning(f"Provider {provider_key} failed: {e}. Initiating fallback...")
            fallback_occurred = True
            fallback_notification = {
                "type": "fallback_notice",
                "failed_provider": provider_key,
                "reason": str(e),
            }
            yield f"event: fallback_notice\ndata: {json.dumps(fallback_notification)}\n\n"
            continue

    # 6. Emit done event
    done_payload = {
        "status": "completed" if successful_provider else "failed",
        "provider_used": successful_provider or "none",
        "attempted": attempted_providers,
    }
    yield f"event: done\ndata: {json.dumps(done_payload)}\n\n"
