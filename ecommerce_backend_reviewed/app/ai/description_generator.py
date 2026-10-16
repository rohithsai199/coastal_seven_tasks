import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.ai.llm_providers import PROVIDERS, BaseLLMProvider
from app.ai.fallback_orchestrator import get_fallback_chain

logger = logging.getLogger(__name__)


class ProductDescriptionRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Product title")
    category: Optional[str] = Field(default="Electronics & Lifestyle", description="Product category")
    features: Optional[List[str]] = Field(default=[], description="Key specs or feature highlights")
    tone: Optional[str] = Field(default="persuasive", description="Tone: luxury, tech, minimalist, casual, persuasive")
    target_audience: Optional[str] = Field(default=None, description="Intended customer demographic")


class ProductDescriptionResponse(BaseModel):
    title_suggestion: str
    short_hook: str
    long_description: str
    bullet_points: List[str]
    seo_keywords: List[str]
    target_audience: str
    provider_used: str


SYSTEM_PROMPT = """You are an expert e-commerce copywriter.
Generate high-converting, professional, and SEO-optimized product content based on the provided product details.

Respond STRICTLY in valid JSON format matching this schema:
{
  "title_suggestion": "Polished high-converting product title",
  "short_hook": "1-2 sentence compelling summary hook",
  "long_description": "2-3 engaging, well-crafted paragraphs highlighting benefits, materials, and usage",
  "bullet_points": ["Key feature 1", "Key feature 2", "Key feature 3", "Key feature 4"],
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "target_audience": "Brief summary of intended customer"
}
"""


def _generate_template_fallback(req: ProductDescriptionRequest) -> ProductDescriptionResponse:
    """Intelligent rule-based fallback generator when external APIs are unavailable."""
    features_list = req.features or [
        "Engineered with premium durable materials for long-lasting performance",
        "Ergonomic, modern design tailored for everyday convenience",
        "Backed by industry-standard quality assurance and manufacturer warranty",
    ]
    
    tone_descriptors = {
        "luxury": ("exquisite craftsmanship", "elevated elegance"),
        "tech": ("next-generation engineering", "cutting-edge capability"),
        "minimalist": ("understated sophistication", "clean, intentional design"),
        "casual": ("effortless everyday comfort", "versatile, relaxed styling"),
        "persuasive": ("uncompromised excellence", "the ultimate performance upgrade"),
    }
    desc_pair = tone_descriptors.get(req.tone.lower(), ("exceptional quality", "modern performance"))

    title = f"{req.name.strip()} – Premium Edition"
    hook = (
        f"Elevate your lifestyle with the {req.name}. Designed with {desc_pair[0]}, "
        f"delivering {desc_pair[1]} for modern enthusiasts."
    )
    long_desc = (
        f"The {req.name} sets a new benchmark in {req.category}. Thoughtfully designed to seamlessly "
        f"integrate into your daily routine, it combines refined aesthetics with relentless reliability. "
        f"Every component has been rigorously tested to ensure unparalleled comfort and lasting durability.\n\n"
        f"Whether you are upgrading your setup or seeking the perfect gift, the {req.name} delivers a transformative "
        f"experience that stands out from ordinary alternatives."
    )
    keywords = [
        req.name.lower(),
        req.category.lower(),
        f"best {req.category.lower()}",
        f"buy {req.name.lower()}",
        "premium",
    ]
    audience = req.target_audience or f"Discerning shoppers looking for high-quality {req.category.lower()}."

    return ProductDescriptionResponse(
        title_suggestion=title,
        short_hook=hook,
        long_description=long_desc,
        bullet_points=features_list,
        seo_keywords=keywords,
        target_audience=audience,
        provider_used="template_fallback_engine",
    )


async def generate_product_description(
    req: ProductDescriptionRequest,
    preferred_provider: Optional[str] = None,
    api_key: Optional[str] = None
) -> ProductDescriptionResponse:
    """
    Generates rich product description using LLM with fallback chain.
    """
    user_prompt = (
        f"Product Name: {req.name}\n"
        f"Category: {req.category}\n"
        f"Feature Highlights: {', '.join(req.features) if req.features else 'Standard premium specifications'}\n"
        f"Desired Tone: {req.tone}\n"
        f"Target Audience: {req.target_audience or 'General shoppers'}"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    fallback_chain = get_fallback_chain(preferred_provider)

    for provider_key in fallback_chain:
        if provider_key == "catalogue_fallback":
            continue

        provider: BaseLLMProvider = PROVIDERS.get(provider_key)
        if not provider or not provider.is_configured(custom_key=api_key):
            continue

        try:
            full_response = []
            async for chunk in provider.stream_chat(messages, custom_key=api_key):
                full_response.append(chunk)

            raw_text = "".join(full_response).strip()
            
            # Clean markdown JSON fences if returned
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            parsed = json.loads(raw_text.strip())

            return ProductDescriptionResponse(
                title_suggestion=parsed.get("title_suggestion", req.name),
                short_hook=parsed.get("short_hook", ""),
                long_description=parsed.get("long_description", ""),
                bullet_points=parsed.get("bullet_points", []),
                seo_keywords=parsed.get("seo_keywords", []),
                target_audience=parsed.get("target_audience", ""),
                provider_used=provider.name,
            )
        except Exception as e:
            logger.warning(f"Provider {provider_key} description generation failed: {e}. Trying fallback...")
            continue

    # Fallback template generator
    return _generate_template_fallback(req)
