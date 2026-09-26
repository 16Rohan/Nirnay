"""
Unified High-Speed LLM wrapper for NIRNAY multi-agent wargaming system.
Supports NVIDIA NIM endpoints with guided JSON decoding, per-role model routing,
configurable retries, and comprehensive execution observability.
"""

import os
import re
import json
import time
import logging
import json_repair
from typing import Type, TypeVar, Optional, Any, Dict
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from rich import print

from backend.llm.schema_utils import simplify_schema_for_guided_json

load_dotenv()

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("nirnay.llm")

# Role to environment variable mapping
ROLE_KEY_MAP: Dict[str, str] = {
    "orchestrator": "ORCHESTRATOR_API_KEY",
    "environment": "ENV_ANALYSIS_API_KEY",
    "red_team": "RED_TEAM_API_KEY",
    "blue_team": "BLUE_TEAM_API_KEY",
    "evaluation": "EVALUATION_API_KEY",
    "simulator": "SIMULATOR_API_KEY",
}

# Per-role default model mapping
ROLE_DEFAULT_MODELS: Dict[str, str] = {
    "orchestrator": "nvidia/nemotron-3-super-120b-a12b",
    "environment": "nvidia/nemotron-3-super-120b-a12b",
    "red_team": "nvidia/nemotron-3-super-120b-a12b",
    "blue_team": "nvidia/nemotron-3-super-120b-a12b",
    "evaluation": "nvidia/nemotron-3-super-120b-a12b",
    "simulator": "nvidia/nemotron-3-super-120b-a12b",
}


class LLMInvocationError(Exception):
    """Raised when LLM invocation fails after all retry attempts."""
    pass


def get_model_for_role(role: str) -> str:
    """Returns the configured model for a given agent role."""
    role_lower = role.lower()
    if role_lower == "evaluation":
        return os.getenv("EVALUATION_MODEL") or os.getenv("NVIDIA_MODEL_NAME") or ROLE_DEFAULT_MODELS["evaluation"]
    return os.getenv("NVIDIA_MODEL_NAME") or ROLE_DEFAULT_MODELS.get(role_lower, "nvidia/nemotron-3-super-120b-a12b")


def get_timeout() -> float:
    """Returns the configured LLM call timeout in seconds."""
    try:
        return float(os.getenv("LLM_TIMEOUT", "60.0"))
    except ValueError:
        return 60.0


def get_max_retries() -> int:
    """Returns the configured retry count."""
    try:
        return int(os.getenv("NUM_RETRIES", "3"))
    except ValueError:
        return 3


def is_fallback_allowed() -> bool:
    """Returns whether agents are permitted to use deterministic fallbacks when LLM fails."""
    return os.getenv("ALLOW_FALLBACKS", "true").strip().lower() in ("true", "1", "yes")


def get_client_for_role(role: str) -> OpenAI:
    """Instantiates an OpenAI client pointed to NVIDIA NIM for the specific agent role."""
    env_var = ROLE_KEY_MAP.get(role.lower(), "ORCHESTRATOR_API_KEY")
    api_key = os.getenv(env_var) or os.getenv("ORCHESTRATOR_API_KEY") or ""
    timeout = get_timeout()
    
    return OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key,
        timeout=timeout
    )


def extract_json_from_text(text: str) -> dict:
    """
    Robust JSON extractor using json_repair to handle malformed LLM outputs.
    Automatically handles duplicate leading braces, unwraps 'properties', and extracts outermost valid dict.
    """
    cleaned = text.strip()

    def _unwrap(d: Any) -> Any:
        if isinstance(d, dict) and "properties" in d and len(d) == 1 and isinstance(d["properties"], dict):
            return d["properties"]
        return d

    # 1. Strip duplicate leading brace if model opened with "{\n{"
    if re.match(r"^\s*\{\s*\{", cleaned):
        cleaned = re.sub(r"^\s*\{\s*\{", "{", cleaned, count=1)

    # 2. Extract using json_repair
    try:
        val = json_repair.loads(cleaned)
        if isinstance(val, dict):
            return _unwrap(val)
    except Exception as e:
        logger.warning(f"json_repair.loads failed: {e}")

    # 3. Strict ```json ... ``` blocks
    json_blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    for block in json_blocks:
        b_str = block.strip()
        if re.match(r"^\s*\{\s*\{", b_str):
            b_str = re.sub(r"^\s*\{\s*\{", "{", b_str, count=1)
        try:
            val = json_repair.loads(b_str)
            if isinstance(val, dict):
                return _unwrap(val)
        except Exception:
            pass

    # 4. Outermost brace boundary extraction with repair
    end = cleaned.rfind("}")
    if end != -1:
        start_idx = 0
        while True:
            start = cleaned.find("{", start_idx)
            if start == -1 or start >= end:
                break
            candidate = cleaned[start:end+1]
            try:
                parsed = json_repair.loads(candidate)
                if isinstance(parsed, dict):
                    return _unwrap(parsed)
            except Exception:
                pass
            start_idx = start + 1

    raise ValueError(f"Unable to extract valid JSON from LLM response:\n{text[:300]}...")


def invoke_structured(
    role: str,
    system_prompt: str,
    user_prompt: str,
    schema: Type[T],
    temperature: float = 0.2,
    max_tokens: int = 4096,
    max_retries: Optional[int] = None
) -> T:
    """
    Invokes LLM via NVIDIA NIM with guided JSON decoding and validates against the Pydantic schema.
    Provides timing, retry logging, and transparent error propagation.
    """
    client = get_client_for_role(role)
    model_name = get_model_for_role(role)
    retries = max_retries if max_retries is not None else get_max_retries()
    
    # Prepare inlined, simplified schema for guided decoding
    simplified_schema = simplify_schema_for_guided_json(schema)
    schema_json_str = json.dumps(simplified_schema, indent=2)

    # Prompt includes strict JSON schema contract
    augmented_system = (
        f"{system_prompt}\n\n"
        f"Return ONLY valid JSON matching this structure. Do not use markdown fences or any text outside the JSON:\n"
        f"{schema_json_str}"
    )

    last_error: Optional[Exception] = None

    print(f"\n[bold cyan][LLM][/bold cyan] Calling [yellow]{role}[/yellow] using model [green]{model_name}[/green]...")

    for attempt in range(1, retries + 1):
        start_time = time.time()
        try:
            create_kwargs: Dict[str, Any] = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": augmented_system},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "top_p": 0.95,
                "max_tokens": max_tokens,
                "extra_body": {"reasoning_effort": "none"}
            }

            resp = client.chat.completions.create(**create_kwargs)
            duration = time.time() - start_time
            
            content = resp.choices[0].message.content or ""
            usage_str = f"prompt={resp.usage.prompt_tokens}, completion={resp.usage.completion_tokens}" if resp.usage else "tokens: N/A"
            
            parsed_dict = extract_json_from_text(content)
            if isinstance(parsed_dict, dict):
                if "scenario_id" not in parsed_dict:
                    if "id" in parsed_dict:
                        parsed_dict["scenario_id"] = str(parsed_dict["id"])
                    elif "scenario" in parsed_dict:
                        parsed_dict["scenario_id"] = str(parsed_dict["scenario"])
                if "forces" in parsed_dict and isinstance(parsed_dict["forces"], dict):
                    for f_key in ("blue", "red", "third_party"):
                        if f_key in parsed_dict["forces"] and isinstance(parsed_dict["forces"][f_key], dict):
                            parsed_dict["forces"][f_key] = [parsed_dict["forces"][f_key]]
            validated = schema.model_validate(parsed_dict)
            
            print(f"[bold green][LLM SUCCESS][/bold green] [yellow]{role}[/yellow] completed in {duration:.2f}s ({usage_str})")
            return validated

        except Exception as e:
            duration = time.time() - start_time
            last_error = e
            err_msg = str(e)
            
            print(f"[bold red][LLM RETRY][/bold red] Attempt {attempt}/{retries} for [yellow]{role}[/yellow] failed after {duration:.2f}s: {err_msg}")
            
            if attempt < retries:
                backoff_delay = 1.0 * attempt
                time.sleep(backoff_delay)

    error_summary = f"All {retries} LLM attempts failed for {role} (model={model_name}): {last_error}"
    print(f"[bold red][LLM ERROR][/bold red] {error_summary}")
    raise LLMInvocationError(error_summary) from last_error
