import os
import logging
from typing import List, Dict, Any, Tuple, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Product

logger = logging.getLogger(__name__)

COLLECTION_NAME = "ecommerce_products"


class RAGService:
    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_directory, exist_ok=True)
        try:
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.warning(f"Falling back to ephemeral in-memory ChromaDB client: {e}")
            self.client = chromadb.EphemeralClient(settings=ChromaSettings(anonymized_telemetry=False))
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )

    @staticmethod
    def _format_chunk(product: Product) -> str:
        """
        Creates a high-density, semantic text chunk for embedding.
        Includes product identity, pricing, availability, and description.
        """
        stock_status = f"{product.stock} units in stock" if product.stock > 0 else "Out of stock"
        return (
            f"Product ID: {product.id}\n"
            f"Title: {product.name}\n"
            f"Price: ${float(product.price):.2f}\n"
            f"Availability: {stock_status}\n"
            f"Description: {product.description or 'No extra description provided.'}\n"
        )

    @staticmethod
    def _format_metadata(product: Product) -> Dict[str, Any]:
        return {
            "product_id": int(product.id),
            "name": str(product.name),
            "price": float(product.price),
            "stock": int(product.stock),
            "image_url": str(product.image_url or ""),
        }

    def upsert_product(self, product: Product) -> None:
        """Upserts a single product chunk into ChromaDB."""
        doc_id = str(product.id)
        doc_text = self._format_chunk(product)
        metadata = self._format_metadata(product)
        self.collection.upsert(
            ids=[doc_id],
            documents=[doc_text],
            metadatas=[metadata]
        )

    def delete_product(self, product_id: int) -> None:
        """Removes a product chunk from ChromaDB."""
        try:
            self.collection.delete(ids=[str(product_id)])
        except Exception as e:
            logger.warning(f"Could not delete product {product_id} from Chroma: {e}")

    def sync_all_products(self, db: Session) -> int:
        """
        Full catalogue chunking and embedding sync from the primary relational database.
        Returns total number of indexed products.
        """
        products = db.query(Product).all()
        if not products:
            return 0

        ids = [str(p.id) for p in products]
        documents = [self._format_chunk(p) for p in products]
        metadatas = [self._format_metadata(p) for p in products]

        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        return len(products)

    def retrieve(self, query: str, top_k: int = 4) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Semantic similarity retrieval over ChromaDB.
        Returns:
            context_string: Formatted context blocks for system prompt.
            citations: Structured list of product objects for citations and UI cards.
        """
        count = self.collection.count()
        if count == 0:
            return "No products are currently available in the catalogue.", []

        actual_k = min(top_k, count)
        results = self.collection.query(
            query_texts=[query],
            n_results=actual_k,
            include=["documents", "metadatas", "distances"]
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        citations: List[Dict[str, Any]] = []
        context_blocks: List[str] = []

        for idx, doc in enumerate(documents):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            dist = distances[idx] if idx < len(distances) else 1.0

            # Cosine distance to similarity percentage (approximate)
            relevance = max(0.0, min(1.0, 1.0 - (dist / 2.0)))

            citation_entry = {
                "id": meta.get("product_id"),
                "name": meta.get("name"),
                "price": meta.get("price"),
                "stock": meta.get("stock"),
                "image_url": meta.get("image_url", ""),
                "relevance_score": round(relevance, 3),
                "snippet": doc.strip()
            }
            citations.append(citation_entry)

            context_blocks.append(
                f"[Product #{citation_entry['id']}]\n"
                f"Name: {citation_entry['name']}\n"
                f"Price: ${citation_entry['price']:.2f}\n"
                f"Stock: {citation_entry['stock']} in stock\n"
                f"Details: {citation_entry['snippet']}"
            )

        context_string = "\n\n".join(context_blocks)
        return context_string, citations

    def get_stats(self) -> Dict[str, Any]:
        """Returns diagnostic statistics of vector collection."""
        try:
            count = self.collection.count()
            return {
                "collection_name": COLLECTION_NAME,
                "persist_directory": self.persist_directory,
                "total_indexed_products": count,
                "status": "ready"
            }
        except Exception as e:
            return {
                "collection_name": COLLECTION_NAME,
                "status": "error",
                "error": str(e)
            }


# Singleton instance
rag_service = RAGService()
