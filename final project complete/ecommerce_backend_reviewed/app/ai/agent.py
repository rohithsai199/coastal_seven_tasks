import json
import re
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import Product, Order
from app.ai.llm_providers import PROVIDERS, BaseLLMProvider
from app.ai.fallback_orchestrator import get_fallback_chain

logger = logging.getLogger(__name__)


# -------------------------------------------------------------
# Tool Implementations (Callable Application Functions)
# -------------------------------------------------------------

def tool_search_catalog(db: Session, query: str, max_price: Optional[float] = None) -> Dict[str, Any]:
    """Search products by keyword and optional maximum price limit."""
    q = db.query(Product).filter(
        (Product.name.ilike(f"%{query}%")) | (Product.description.ilike(f"%{query}%"))
    )
    if max_price is not None:
        q = q.filter(Product.price <= max_price)
    products = q.limit(5).all()
    return {
        "count": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "stock": p.stock,
                "in_stock": p.stock > 0,
            }
            for p in products
        ],
    }


def tool_get_order_status(db: Session, order_id: int) -> Dict[str, Any]:
    """Retrieve live status, items, and shipping info for an order ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return {"found": False, "message": f"Order #{order_id} could not be located in our records."}

    return {
        "found": True,
        "order_id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "item_count": len(order.items) if order.items else 0,
        "shipping_city": order.shipping_city,
    }


def tool_check_inventory(db: Session, product_name: str) -> Dict[str, Any]:
    """Verify inventory levels and availability for a product."""
    product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
    if not product:
        return {"found": False, "message": f"No product found matching '{product_name}'."}

    return {
        "found": True,
        "id": product.id,
        "name": product.name,
        "stock": product.stock,
        "is_available": product.stock > 0,
        "price": float(product.price),
    }


def tool_get_promotions() -> Dict[str, Any]:
    """Retrieve active coupon codes and store promotions."""
    return {
        "active_promotions": [
            {
                "code": "AURORA20",
                "discount": "20% OFF",
                "category": "Wireless Tech & Audio",
                "description": "Summer Drop 2026 promotion for all audio gear.",
            },
            {
                "code": "WELCOME10",
                "discount": "10% OFF",
                "category": "Site-wide",
                "description": "First purchase welcoming discount.",
            },
        ]
    }


AVAILABLE_TOOLS = {
    "search_catalog": tool_search_catalog,
    "get_order_status": tool_get_order_status,
    "check_inventory": tool_check_inventory,
    "get_promotions": tool_get_promotions,
}

TOOL_SCHEMAS = [
    {
        "name": "search_catalog",
        "description": "Searches store catalogue for items matching a keyword and optional price ceiling",
        "parameters": {"query": "string (search keyword)", "max_price": "float (optional)"},
    },
    {
        "name": "get_order_status",
        "description": "Checks the real-time fulfillment status and total for a specific order ID",
        "parameters": {"order_id": "integer"},
    },
    {
        "name": "check_inventory",
        "description": "Checks warehouse stock and availability for a specific product name",
        "parameters": {"product_name": "string"},
    },
    {
        "name": "get_promotions",
        "description": "Returns active discount codes and promotions for customers",
        "parameters": {},
    },
]


class AIAgentOrchestrator:
    """
    Autonomous AI agent capable of intent recognition, tool selection,
    execution of application functions, and synthesis of tool results.
    """

    @classmethod
    def execute_agent_workflow(
        cls,
        db: Session,
        user_message: str,
        preferred_provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        executed_tools = []
        msg_lower = user_message.lower()

        # 1. Deterministic Intent & Function Call Classifier
        # Order Tracking Intent
        order_match = re.search(r"order\s+#?(\d+)", msg_lower)
        if order_match:
            order_id = int(order_match.group(1))
            tool_res = tool_get_order_status(db, order_id=order_id)
            executed_tools.append({
                "tool_name": "get_order_status",
                "args": {"order_id": order_id},
                "result": tool_res,
            })
            if tool_res["found"]:
                answer = (
                    f"📦 **Order Status for #{order_id}**:\n\n"
                    f"- **Status**: `{tool_res['status']}`\n"
                    f"- **Total Amount**: ${tool_res['total_amount']:.2f}\n"
                    f"- **Items**: {tool_res['item_count']} item(s)\n"
                    f"- **Shipping Destination**: {tool_res.get('shipping_city') or 'Recorded address'}\n\n"
                    "Let me know if you would like me to assist you with tracking or modifying your order!"
                )
            else:
                answer = f"I checked our database, but could not locate Order #{order_id}. Please verify the order number."

            return {
                "answer": answer,
                "executed_tools": executed_tools,
                "agent_decision": "Tool: get_order_status invoked",
            }

        # Discount / Promo Intent
        if any(w in msg_lower for w in ["promo", "coupon", "discount", "offer", "voucher", "code"]):
            tool_res = tool_get_promotions()
            executed_tools.append({
                "tool_name": "get_promotions",
                "args": {},
                "result": tool_res,
            })
            promos_text = "\n".join([
                f"- **`{p['code']}`**: {p['discount']} – {p['description']}"
                for p in tool_res["active_promotions"]
            ])
            answer = (
                f"🎉 **Active Store Promotions & Coupons**:\n\n{promos_text}\n\n"
                "You can apply any of these codes directly during checkout!"
            )
            return {
                "answer": answer,
                "executed_tools": executed_tools,
                "agent_decision": "Tool: get_promotions invoked",
            }

        # Inventory / Stock Check Intent
        stock_keywords = ["stock", "available", "inventory", "units left", "how many"]
        if any(w in msg_lower for w in stock_keywords):
            # Extract product candidate
            clean_term = re.sub(r"(do you have|in stock|is there any|how many|available|check stock for|\?)", "", msg_lower).strip()
            if clean_term:
                tool_res = tool_check_inventory(db, product_name=clean_term)
                executed_tools.append({
                    "tool_name": "check_inventory",
                    "args": {"product_name": clean_term},
                    "result": tool_res,
                })
                if tool_res["found"]:
                    status_text = f"**{tool_res['stock']} units** currently in stock" if tool_res["is_available"] else "**Out of stock**"
                    answer = (
                        f"📊 **Inventory Report for {tool_res['name']}**:\n\n"
                        f"- **Availability**: {status_text}\n"
                        f"- **Price**: ${tool_res['price']:.2f}\n"
                        f"- **Product ID**: #{tool_res['id']}\n\n"
                        "Would you like me to reserve one or add it to your cart?"
                    )
                    return {
                        "answer": answer,
                        "executed_tools": executed_tools,
                        "agent_decision": "Tool: check_inventory invoked",
                    }

        # Catalogue Search Tool Intent (e.g. price ceiling filter)
        price_match = re.search(r"under\s+\$?(\d+(\.\d+)?)", msg_lower)
        max_p = float(price_match.group(1)) if price_match else None
        clean_search = re.sub(r"(under\s+\$?\d+(\.\d+)?|find|search|show me|looking for|recommend)", "", msg_lower).strip()
        search_kw = clean_search if clean_search else "popular"

        tool_res = tool_search_catalog(db, query=search_kw, max_price=max_p)
        executed_tools.append({
            "tool_name": "search_catalog",
            "args": {"query": search_kw, "max_price": max_p},
            "result": tool_res,
        })

        if tool_res["count"] > 0:
            lines = [
                f"- **{p['name']}** – ${p['price']:.2f} ({p['stock']} in stock)"
                for p in tool_res["products"]
            ]
            answer = (
                f"🔎 **Agent Search Results** for *'{search_kw}'*{f' under ${max_p:.2f}' if max_p else ''}:\n\n"
                + "\n".join(lines)
                + "\n\nLet me know if you would like full specifications on any of these products!"
            )
        else:
            answer = f"I queried our catalogue for *'{search_kw}'*, but didn't find any products matching those criteria."

        return {
            "answer": answer,
            "executed_tools": executed_tools,
            "agent_decision": "Tool: search_catalog invoked",
        }
