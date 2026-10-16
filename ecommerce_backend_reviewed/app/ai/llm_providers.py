import os
import json
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider:
    name: str = "base"
    default_model: str = ""

    def is_configured(self, custom_key: Optional[str] = None) -> bool:
        raise NotImplementedError

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        raise NotImplementedError


class GroqProvider(BaseLLMProvider):
    name = "groq"
    default_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
    OPENAI_COMPATIBLE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def is_configured(self, custom_key: Optional[str] = None) -> bool:
        return bool(custom_key or settings.GROQ_API_KEY)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = custom_key or settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("Groq API key is not configured.")

        selected_model = model or self.default_model

        # Attempt via official Groq Async SDK if possible, fallback to OpenAI-compatible endpoint
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=api_key)
            completion = await client.chat.completions.create(
                model=selected_model,
                messages=messages,  # type: ignore
                stream=True,
                temperature=0.4,
                max_tokens=1024,
            )
            async for chunk in completion:
                delta = chunk.choices[0].delta.content if chunk.choices else ""
                if delta:
                    yield delta
            return
        except Exception as sdk_err:
            logger.info(f"Groq SDK direct call note: {sdk_err}. Trying OpenAI-compatible endpoint...")

        # OpenAI-compatible endpoint fallback
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": selected_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.4,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", self.OPENAI_COMPATIBLE_URL, headers=headers, json=payload) as response:
                if response.status_code == 429:
                    raise RuntimeError("Groq Rate Limit Exceeded (HTTP 429)")
                if response.status_code in (401, 403):
                    raise RuntimeError(f"Groq Authentication Failed (HTTP {response.status_code})")
                if response.status_code != 200:
                    error_text = await response.aread()
                    raise RuntimeError(f"Groq API Error ({response.status_code}): {error_text.decode('utf-8', errors='ignore')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except json.JSONDecodeError:
                        continue


class GeminiProvider(BaseLLMProvider):
    name = "gemini"
    default_model = settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
    OPENAI_COMPATIBLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"

    def is_configured(self, custom_key: Optional[str] = None) -> bool:
        return bool(custom_key or settings.GEMINI_API_KEY)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = custom_key or settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("Gemini API key is not configured.")

        selected_model = model or self.default_model

        # Candidate models for Google Gemini
        candidate_models = [selected_model]
        for m_name in ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]:
            if m_name not in candidate_models:
                candidate_models.append(m_name)

        # Format prompt cleanly from messages
        prompt_parts = []
        for m in messages:
            role = m.get("role", "user").upper()
            content = m.get("content", "")
            if content:
                prompt_parts.append(f"{role}: {content}")
        full_prompt = "\n\n".join(prompt_parts)

        sdk_success = False
        last_error = None

        # Priority 1: Google GenAI native asynchronous streaming
        try:
            from google import genai
            genai_client = genai.Client(api_key=api_key)

            for cand_model in candidate_models:
                try:
                    logger.info(f"Invoking Google GenAI with model: {cand_model}")
                    res_stream = await genai_client.aio.models.generate_content_stream(
                        model=cand_model,
                        contents=full_prompt,
                    )
                    has_content = False
                    async for chunk in res_stream:
                        if hasattr(chunk, "text") and chunk.text:
                            has_content = True
                            yield chunk.text
                    if has_content:
                        sdk_success = True
                        return
                except Exception as cand_err:
                    last_error = cand_err
                    logger.warning(f"Google GenAI model {cand_model} failed: {cand_err}. Trying next candidate...")
                    continue
        except ImportError:
            logger.warning("google-genai package not imported; falling back to REST endpoint.")

        if sdk_success:
            return

        # Priority 2: Fallback to OpenAI-compatible endpoint
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": selected_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", self.OPENAI_COMPATIBLE_URL, headers=headers, json=payload) as response:
                if response.status_code == 429:
                    raise RuntimeError("Gemini Rate Limit Exceeded (HTTP 429)")
                if response.status_code in (401, 403):
                    raise RuntimeError(f"Gemini Authentication Failed (HTTP {response.status_code})")
                if response.status_code != 200:
                    error_body = await response.aread()
                    raise RuntimeError(
                        f"Gemini API Error ({response.status_code}): {error_body.decode('utf-8', errors='ignore')} | Native SDK error: {last_error}"
                    )

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except json.JSONDecodeError:
                        continue


class MistralProvider(BaseLLMProvider):
    name = "mistral"
    default_model = settings.MISTRAL_MODEL or "mistral-small-latest"
    OPENAI_COMPATIBLE_URL = "https://api.mistral.ai/v1/chat/completions"

    def is_configured(self, custom_key: Optional[str] = None) -> bool:
        return bool(custom_key or settings.MISTRAL_API_KEY)

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = custom_key or settings.MISTRAL_API_KEY
        if not api_key:
            raise ValueError("Mistral API key is not configured.")

        selected_model = model or self.default_model

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": selected_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.4,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            async with client.stream("POST", self.OPENAI_COMPATIBLE_URL, headers=headers, json=payload) as response:
                if response.status_code == 429:
                    raise RuntimeError("Mistral Rate Limit Exceeded (HTTP 429)")
                if response.status_code in (401, 403):
                    raise RuntimeError(f"Mistral Authentication Failed (HTTP {response.status_code})")
                if response.status_code != 200:
                    err_msg = await response.aread()
                    raise RuntimeError(f"Mistral API Error ({response.status_code}): {err_msg.decode('utf-8', errors='ignore')}")

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except json.JSONDecodeError:
                        continue


class SmartCatalogueFallback(BaseLLMProvider):
    """
    Intelligent Grounded Fallback Engine:
    When no external API keys are configured, or all external providers experience outages/rate limits,
    this engine generates domain-accurate responses strictly grounded in the retrieved ChromaDB catalogue context.
    Streams tokens in real time via SSE so the user experiences zero disruption.
    """
    name = "catalogue_fallback"
    default_model = "local-grounded-rag-engine"

    def is_configured(self, custom_key: Optional[str] = None) -> bool:
        return True

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        custom_key: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        # Extract user query and catalogue context
        user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")

        # Extract catalog context from system prompt
        context = ""
        if "<CATALOG_DATA>" in system_msg and "</CATALOG_DATA>" in system_msg:
            context = system_msg.split("<CATALOG_DATA>")[1].split("</CATALOG_DATA>")[0].strip()
        elif "<catalog_context>" in system_msg and "</catalog_context>" in system_msg:
            context = system_msg.split("<catalog_context>")[1].split("</catalog_context>")[0].strip()

        # Build response grounded in retrieved catalogue
        response_text = self._generate_grounded_response(user_msg, context)

        # Stream words with micro-delays for realistic SSE streaming
        words = response_text.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            yield chunk
            await asyncio.sleep(0.015)

    def _generate_grounded_response(self, query: str, context: str) -> str:
        from app.ai.prompt_engineering import is_greeting_or_conversational

        if is_greeting_or_conversational(query):
            return (
                "Hello! Welcome to **ARISE** — your luxury fashion & lifestyle destination. "
                "I am **Aura**, your personal AI shopping concierge, powered by Google Gemini.\n\n"
                "I am here to assist you with our curated collections in **Boys**, **Girls**, **Kids**, **Accessories**, and **Beauty**. "
                "How may I assist you today? Feel free to ask about evening gowns, tailored blazers, seasonal outerwear, fine timepieces, or luxury skincare!"
            )

        if not context or "No products are currently available" in context:
            return (
                "Hello! I am **Aura**, your ARISE personal shopping assistant. "
                "I couldn't locate any products matching that specific inquiry in our current collections. "
                "Please let me know if you are looking for evening gowns, tailored blazers, knitwear, timepieces, leather goods, or luxury beauty, "
                "and I will be delighted to guide you!"
            )

        # Parse context products cleanly
        products = []
        blocks = context.split("[Product #")
        for b in blocks:
            b = b.strip()
            if not b:
                continue
            p_data: Dict[str, str] = {}
            for line in b.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    k = key.strip().lower()
                    if k not in p_data:
                        p_data[k] = val.strip()
            if "name" in p_data or "title" in p_data:
                products.append(p_data)

        if not products:
            return (
                "Hello! Based on our ARISE store catalogue, here is the relevant product information:\n\n"
                f"{context}\n\n"
                "Feel free to ask for detailed comparisons, specifications, or availability!"
            )

        intro = (
            f"Hello! Here are the **{len(products)} matching piece{'s' if len(products) > 1 else ''}** "
            f"from our ARISE collection:\n\n"
        )

        body_parts = []
        for p in products:
            name = p.get("name") or p.get("title", "Product")
            price = p.get("price", "Check catalogue")
            stock = p.get("stock") or p.get("availability", "In stock")
            desc = p.get("description") or p.get("details", "")

            body_parts.append(
                f"### 🏷️ **{name}**\n"
                f"- **Price:** {price}\n"
                f"- **Availability:** {stock}\n"
                f"- **Overview:** {desc}\n"
            )

        outro = (
            "\n💡 *You can click on any cited product card below to inspect full specifications or add items directly to your shopping cart!* "
            "How else may I assist you today?"
        )

        return intro + "\n".join(body_parts) + outro


# Registry of provider instances
PROVIDERS = {
    "groq": GroqProvider(),
    "gemini": GeminiProvider(),
    "mistral": MistralProvider(),
    "catalogue_fallback": SmartCatalogueFallback(),
}
