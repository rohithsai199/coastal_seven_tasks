import logging
from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

from app.ai.prompt_engineering import rag_chat_prompt
from app.ai.rag_service import rag_service
from app.models import Product

logger = logging.getLogger(__name__)


def create_langchain_documents_from_products(products: List[Product]) -> List[Document]:
    """
    Demonstrates LangChain Document modeling:
    Converts database models into chunked LangChain Document objects with rich metadata.
    """
    docs = []
    for p in products:
        content = (
            f"Product: {p.name}\n"
            f"Price: ${float(p.price):.2f}\n"
            f"Stock: {p.stock} units\n"
            f"Description: {p.description or 'No extra description'}"
        )
        metadata = {
            "source": f"product_id_{p.id}",
            "product_id": p.id,
            "title": p.name,
            "price": float(p.price),
            "stock": p.stock,
            "image_url": p.image_url or "",
        }
        docs.append(Document(page_content=content, metadata=metadata))
    return docs


def retrieve_context_for_langchain(query: str) -> Dict[str, Any]:
    """
    Retriever runnable function for LangChain pipeline.
    """
    context_text, citations = rag_service.retrieve(query, top_k=4)
    return {
        "context": context_text,
        "citations": citations,
    }


class LangChainRAGWorkflow:
    """
    Modular LangChain workflow assembling retrieval, prompt engineering,
    and output parsing.
    """

    @staticmethod
    def format_docs_for_prompt(inputs: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "context": inputs.get("context", ""),
            "question": inputs.get("question", ""),
            "chat_history": inputs.get("chat_history", []),
        }

    @classmethod
    def execute(cls, question: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Executes modular RAG pipeline:
        1. Context retrieval
        2. Prompt formatting
        3. Returns assembled prompt and citations for modularity.
        """
        retrieved = retrieve_context_for_langchain(question)
        context = retrieved["context"]
        citations = retrieved["citations"]

        prompt_val = rag_chat_prompt.invoke({
            "context": context,
            "question": question,
            "chat_history": []
        })

        return {
            "context": context,
            "citations": citations,
            "messages": prompt_val.to_messages(),
            "formatted_text": prompt_val.to_string(),
        }
