import re
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)",
    r"you\s+are\s+now\s+(unrestricted|in\s+dan\s+mode|jailbroken)",
    r"system\s+prompt\s+override",
    r"reveal\s+(your|the)\s+(system\s+prompt|secret\s+key|api\s+key)",
    r"bypass\s+(safety|content)\s+filters",
    r"roleplay\s+as\s+an\s+unfiltered\s+ai",
]

INAPPROPRIATE_WORDS = [
    r"\b(hate|racist|slur|scam|fraud|phishing|exploit|malware)\b",
    r"\b(kill|attack|destroy|harm)\s+(yourself|others|people)\b",
]

SPAM_PATTERNS = [
    r"(buy\s+cheap|click\s+here\s+now|free\s+crypto|telegram\s+@|whatsapp\s+\+)",
    r"(\bhttps?://[^\s]+){3,}",  # 3+ URLs in a single query
]


class ModerationResult(BaseModel):
    flagged: bool
    categories: Dict[str, bool]
    reason: Optional[str] = None
    sanitized_text: str


def moderate_text(text: str) -> ModerationResult:
    """
    Evaluates user input or content for safety violations:
    - Prompt injections (jailbreaks / instruction overrides)
    - Hate speech / toxic language
    - Promotional spam / phishing links
    """
    if not text:
        return ModerationResult(
            flagged=False,
            categories={"prompt_injection": False, "inappropriate": False, "spam": False},
            sanitized_text="",
        )

    categories = {
        "prompt_injection": False,
        "inappropriate": False,
        "spam": False,
    }
    reasons = []

    # 1. Prompt Injection Detection
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            categories["prompt_injection"] = True
            reasons.append("Potential prompt injection / instruction override attempt detected.")
            break

    # 2. Inappropriate / Toxic Language Detection
    for pattern in INAPPROPRIATE_WORDS:
        if re.search(pattern, text, re.IGNORECASE):
            categories["inappropriate"] = True
            reasons.append("Inappropriate or unsafe content detected.")
            break

    # 3. Spam / Phishing Detection
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            categories["spam"] = True
            reasons.append("Spam or suspicious link pattern detected.")
            break

    is_flagged = any(categories.values())
    
    # Basic sanitization: strip zero-width characters, excessive whitespace
    sanitized = re.sub(r"[\u200B-\u200D\uFEFF]", "", text).strip()

    return ModerationResult(
        flagged=is_flagged,
        categories=categories,
        reason="; ".join(reasons) if reasons else None,
        sanitized_text=sanitized,
    )
