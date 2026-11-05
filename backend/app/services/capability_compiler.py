from __future__ import annotations

from typing import Any


KNOWN = {
    "bfsi domain expertise": (["bank", "financial", "insurance", "bfsi"], 1.0),
    "enterprise ai implementation": (["ai", "implementation", "automation"], 0.95),
    "cloud deployment": (["cloud", "infrastructure", "deployment"], 0.8),
    "enterprise data integration": (["data", "integration", "api"], 0.9),
    "enterprise distribution": (["distribution", "enterprise", "sales", "channel"], 0.95),
}


def compile_capabilities(capabilities: list[str]) -> list[dict[str, Any]]:
    compiled = []
    for original in capabilities:
        canonical = " ".join(original.lower().split())
        aliases, weight = KNOWN.get(canonical, ([canonical], 0.75))
        compiled.append({
            "name": original,
            "canonical_name": canonical,
            "description": f"Capability required for the stated market-entry objective: {original}.",
            "importance_weight": weight,
            "required": True,
            "search_aliases": aliases,
            "evidence_required": "Provider company description, industry, supported capability, or independent web evidence.",
            "dependencies": [],
        })
    return compiled
