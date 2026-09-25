"""
Schema utilities for NVIDIA NIM guided_json structured output.
Simplifies and inlines Pydantic schemas so NVIDIA NIM's guided decoding engine
can enforce them reliably without $defs reference errors or schema complexity timeouts.
"""

from typing import Type, Dict, Any, Set
import copy
from pydantic import BaseModel


def resolve_defs(schema: Dict[str, Any], max_depth: int = 20) -> Dict[str, Any]:
    """
    Recursively inlines all $defs and $ref references in a JSON Schema.
    """
    schema = copy.deepcopy(schema)
    defs = schema.pop("$defs", {})
    if not defs:
        defs = schema.pop("definitions", {})

    def _resolve(node: Any, depth: int = 0) -> Any:
        if depth > max_depth:
            return node
        if isinstance(node, dict):
            if "$ref" in node:
                ref = node["$ref"]
                ref_key = ref.split("/")[-1]
                if ref_key in defs:
                    resolved = copy.deepcopy(defs[ref_key])
                    return _resolve(resolved, depth + 1)
            return {k: _resolve(v, depth + 1) for k, v in node.items()}
        elif isinstance(node, list):
            return [_resolve(item, depth + 1) for item in node]
        return node

    resolved_schema = _resolve(schema)
    return resolved_schema


def clean_schema_metadata(node: Any, strip_descriptions: bool = False) -> Any:
    """
    Removes bulky metadata fields that guided decoding doesn't need,
    reducing token count and parser overhead.
    """
    if isinstance(node, dict):
        cleaned = {}
        for k, v in node.items():
            if k in ("title", "$schema", "default_factory"):
                continue
            if strip_descriptions and k == "description":
                continue
            cleaned[k] = clean_schema_metadata(v, strip_descriptions=strip_descriptions)
        return cleaned
    elif isinstance(node, list):
        return [clean_schema_metadata(item, strip_descriptions=strip_descriptions) for item in node]
    return node


def simplify_schema_for_guided_json(
    model: Type[BaseModel],
    strip_descriptions: bool = False
) -> Dict[str, Any]:
    """
    Converts a Pydantic model into a clean, fully-inlined JSON schema
    optimized for NVIDIA NIM `extra_body={"guided_json": ...}`.
    """
    raw_schema = model.model_json_schema()
    inlined = resolve_defs(raw_schema)
    cleaned = clean_schema_metadata(inlined, strip_descriptions=strip_descriptions)
    return cleaned
