import re
from typing import List, Dict, Any, Optional
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

GREETING_PATTERNS = [
    r"^(hi+|hey+|hello+|helo+|hola|howdy|yo|greetings)[\s!.,?]*$",
    r"^(good\s+(morning|afternoon|evening|day))[\s!.,?]*$",
    r"^(how\s+are\s+you(\s+doing)?|how('s|s)\s+it\s+going|what('s|s)\s+up)[\s!.,?]*$",
    r"^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+are\s+you|tell\s+me\s+about\s+yourself)[\s!.,?]*$",
    r"^(what\s+can\s+you\s+do|how\s+can\s+you\s+help(\s+me)?)[\s!.,?]*$",
    r"^(thanks|thank\s+you|thx|cheers|bye|goodbye|see\s+ya)[\s!.,?]*$",
    r"^(ok|okay|cool|nice|great|awesome)[\s!.,?]*$",
]

def is_greeting_or_conversational(query: str) -> bool:
    """
    Returns True if the query is a greeting, introduction, or general conversational remark
    rather than a specific request for products or shopping search.
    """
    if not query:
        return True
    q = query.strip().lower()
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, q):
            return True
    return False


GREETING_SYSTEM_PROMPT = """You are Aura, the premier AI shopping concierge for ARISE — an exclusive luxury fashion and lifestyle destination featuring curated collections in Boys, Girls, Kids, Accessories, and Beauty.

Persona & Intelligence:
- Sophisticated, warm, attentive, and helpful, powered by Google Gemini.
- Communicate with the elegance and polish of a high-end luxury fashion boutique advisor.
- Keep your response engaging, concise, and natural.

Critical Rule for Greetings & Small Talk:
- The customer is saying hello, greeting you, or engaging in casual conversation.
- Welcome them warmly to ARISE and introduce yourself as their dedicated AI concierge.
- Mention that we offer curated collections across Boys, Girls, Kids, Accessories, and Beauty.
- Ask how you can assist them today (such as finding evening gowns, tailored blazers, seasonal outerwear, fine accessories, or skincare).
- STRICT RULE: DO NOT list, suggest, or dump specific products, prices, or catalogue cards in this greeting turn. Wait until the customer tells you what kind of product, style, or collection they are looking for!
"""

PRODUCT_SYSTEM_PROMPT = """You are Aura, the premier AI shopping concierge for ARISE.
Your mission is to deliver delightful, personalized, and strictly accurate product recommendations and answer customer inquiries about items in our store.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. Strict Store Catalogue Grounding:
   - Base all product recommendations, features, specifications, prices, and availability STRICTLY and ONLY on the <CATALOG_DATA> provided below.
   - The catalogue context represents the REAL products available in the ARISE store UI (Boys, Girls, Kids, Accessories, and Beauty).
   - NEVER invent, hallucinate, or recommend external products, third-party brands, or items not present in the context.
   - If the customer asks for a product or category not found in our catalogue, politely inform them that ARISE does not currently carry that item, and guide them toward the closest relevant pieces from our store collection.

2. Product Accuracy & Citations:
   - Always quote exact prices from the context prefixed with '$' (e.g. $180.00).
   - Mention availability/stock status when helpful.
   - Highlight fine fabrics, tailoring, craftsmanship, materials, and styling notes.
   - Always refer to products by their official store name so customers can easily identify them.

3. Tone & Structure:
   - Polished, elegant, concise, and structured (like Google Gemini).
   - Use clean markdown bullet points, bold product titles, and readable summaries.
   - Keep answers focused, engaging, and easy to skim.

<CATALOG_DATA>
{context}
</CATALOG_DATA>
"""

USER_PROMPT_TEMPLATE = """Customer Query: {question}"""

# LangChain ChatPromptTemplate definition for RAG
rag_chat_prompt = ChatPromptTemplate.from_messages([
    ("system", PRODUCT_SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history", optional=True),
    ("human", USER_PROMPT_TEMPLATE)
])


def build_system_prompt(context: str, is_greeting: bool = False) -> str:
    """Builds a formatted system prompt injected with product catalog context or greeting persona."""
    if is_greeting or not context or context.strip() == "No products are currently available in the catalogue.":
        return GREETING_SYSTEM_PROMPT
    return PRODUCT_SYSTEM_PROMPT.format(context=context)


def build_openai_messages(
    question: str,
    context: str = "",
    history: Optional[List[Dict[str, str]]] = None,
    is_greeting: Optional[bool] = None,
) -> List[Dict[str, str]]:
    """
    Constructs an OpenAI-compatible messages payload suitable for Google Gemini, Groq, and Mistral.
    """
    if is_greeting is None:
        is_greeting = is_greeting_or_conversational(question)

    system_msg = build_system_prompt(context, is_greeting=is_greeting)
    messages = [{"role": "system", "content": system_msg}]

    if history:
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question})
    return messages
