import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.rag_service import rag_service
from app.ai.prompt_engineering import build_system_prompt, build_openai_messages
from app.ai.fallback_orchestrator import get_fallback_chain

client = TestClient(app)


def test_ai_status_endpoint():
    response = client.get("/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "vector_store" in data
    assert "providers" in data
    assert "fallback_order" in data
    assert "groq" in data["providers"]
    assert "gemini" in data["providers"]
    assert "mistral" in data["providers"]


def test_ai_reindex_endpoint():
    response = client.post("/ai/reindex")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_indexed"] >= 0


def test_rag_semantic_retrieval():
    context, citations = rag_service.retrieve("wireless headphones", top_k=3)
    assert isinstance(context, str)
    assert isinstance(citations, list)
    if citations:
        first = citations[0]
        assert "id" in first
        assert "name" in first
        assert "price" in first
        assert "stock" in first
        assert "relevance_score" in first


def test_prompt_engineering_grounding():
    mock_context = "[Product #1]\nName: Test Widget\nPrice: $49.99\nStock: 10 in stock"
    prompt = build_system_prompt(mock_context)
    assert "<CATALOG_DATA>" in prompt
    assert "Test Widget" in prompt
    assert "CRITICAL INSTRUCTIONS & GROUNDING RULES" in prompt

    messages = build_openai_messages("Tell me about Test Widget", mock_context)
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"


def test_fallback_chain_ordering():
    chain_auto = get_fallback_chain()
    assert chain_auto[0] == "gemini"
    assert chain_auto[-1] == "catalogue_fallback"

    chain_gemini_preferred = get_fallback_chain(preferred_provider="gemini")
    assert chain_gemini_preferred[0] == "gemini"
    assert chain_gemini_preferred[-1] == "catalogue_fallback"


def test_langchain_diagnostic_endpoint():
    response = client.get("/ai/langchain/test?q=smartwatch")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "smartwatch"
    assert "citations" in data
    assert "langchain_messages_count" in data


def test_ai_chat_sync_endpoint():
    response = client.post(
        "/ai/chat",
        json={"query": "Do you have noise cancelling headphones?", "top_k": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 0
    assert "citations" in data
    assert isinstance(data["citations"], list)
