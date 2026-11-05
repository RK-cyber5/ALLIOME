from __future__ import annotations

from typing import Any


def normalize_brief(request: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
    """Normalize predictable input variations without an LLM dependency."""
    warnings: list[dict[str, str]] = []
    aliases = {"bfs i": "BFSI", "financial services": "BFSI", "india": "India"}
    normalized = dict(request)
    for key in ("target_market", "target_industry", "business_goal", "ideal_customer", "product_description"):
        value = " ".join(str(normalized[key]).split())
        normalized[key] = aliases.get(value.lower(), value)
    if not normalized.get("required_capabilities"):
        normalized["required_capabilities"] = ["Enterprise distribution", "Enterprise implementation"]
        warnings.append({"code": "capabilities_defaulted", "message": "No required capabilities supplied; deterministic defaults were used."})
    if not normalized.get("partner_types"):
        normalized["partner_types"] = ["Implementation partner", "Distribution partner"]
        warnings.append({"code": "partner_types_defaulted", "message": "No partner types supplied; deterministic defaults were used."})
    return normalized, warnings
