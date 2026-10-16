import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import Product
from app.ai.rag_service import rag_service
from app.ai.cache import get_cached_ai_response, set_cached_ai_response

logger = logging.getLogger(__name__)


def perform_semantic_search(
    db: Session,
    query: str,
    limit: int = 10,
    min_score: float = 0.35,
    max_price: Optional[float] = None,
    in_stock_only: bool = False
) -> Dict[str, Any]:
    """
    Performs vector similarity search against ChromaDB product catalog.
    Enables intelligent intent-based discovery beyond exact keyword matching.
    Includes Redis caching to accelerate repeated searches.
    """
    cache_params = {
        "q": query.strip().lower(),
        "limit": limit,
        "min_score": min_score,
        "max_price": max_price,
        "in_stock_only": in_stock_only,
    }

    # 1. Check Redis cache
    cached = get_cached_ai_response("semantic_search", cache_params)
    if cached is not None:
        cached_result = dict(cached)
        cached_result["cached"] = True
        return cached_result

    # 2. Query ChromaDB vector collection
    total_docs = rag_service.collection.count()
    if total_docs == 0:
        rag_service.sync_all_products(db)
        total_docs = rag_service.collection.count()

    actual_k = min(limit * 2, total_docs) if total_docs > 0 else 0
    if actual_k == 0:
        return {"query": query, "total_found": 0, "results": [], "cached": False}

    results = rag_service.collection.query(
        query_texts=[query],
        n_results=actual_k,
        include=["metadatas", "distances"]
    )

    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    matched_product_ids = []
    score_by_id = {}

    for idx, meta in enumerate(metadatas):
        p_id = meta.get("product_id")
        dist = distances[idx] if idx < len(distances) else 1.0
        # Cosine distance to similarity percentage
        similarity = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
        
        if similarity >= min_score and p_id is not None:
            matched_product_ids.append(p_id)
            score_by_id[p_id] = round(similarity, 3)

    if not matched_product_ids:
        response_data = {"query": query, "total_found": 0, "results": [], "cached": False}
        set_cached_ai_response("semantic_search", cache_params, response_data, ttl_seconds=600)
        return response_data

    # 3. Fetch latest live DB records for accurate inventory & pricing
    db_query = db.query(Product).filter(Product.id.in_(matched_product_ids))
    if max_price is not None:
        db_query = db_query.filter(Product.price <= max_price)
    if in_stock_only:
        db_query = db_query.filter(Product.stock > 0)

    db_products = {p.id: p for p in db_query.all()}

    # 4. Assemble sorted results by semantic score
    final_items = []
    for p_id in matched_product_ids:
        if p_id in db_products and len(final_items) < limit:
            p = db_products[p_id]
            final_items.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "stock": p.stock,
                "image_url": p.image_url,
                "similarity_score": score_by_id.get(p_id, 0.0),
                "match_percentage": int(score_by_id.get(p_id, 0.0) * 100),
            })

    final_payload = {
        "query": query,
        "total_found": len(final_items),
        "results": final_items,
        "cached": False,
    }

    # Cache successful search in Redis (10 minutes TTL)
    set_cached_ai_response("semantic_search", cache_params, final_payload, ttl_seconds=600)
    return final_payload
