"""
Startup validation module for NVIDIA NIM LLM connectivity.
Checks API keys, models, and endpoint responsiveness for all Nirnay agent roles.
Can be run standalone: `uv run python -m backend.llm.validate`
"""

import os
import sys
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from typing import Dict, Any, Tuple
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

from backend.llm.wrapper import (
    ROLE_KEY_MAP,
    get_model_for_role,
    get_client_for_role,
)

load_dotenv()
console = Console()


def mask_key(key: str) -> str:
    """Masks an API key for safe terminal display."""
    if not key:
        return "[red]MISSING[/red]"
    if len(key) <= 8:
        return "***"
    return f"{key[:6]}...{key[-4:]}"


def validate_single_role(role: str, quick: bool = True) -> Dict[str, Any]:
    """
    Validates connectivity for a single role.
    """
    env_var = ROLE_KEY_MAP.get(role.lower(), "ORCHESTRATOR_API_KEY")
    api_key = os.getenv(env_var) or os.getenv("ORCHESTRATOR_API_KEY") or ""
    model_name = get_model_for_role(role)
    
    result = {
        "role": role,
        "env_var": env_var,
        "key_preview": mask_key(api_key),
        "model": model_name,
        "status": "UNKNOWN",
        "latency_sec": 0.0,
        "error": None
    }

    if not api_key or api_key.startswith("your_") or "placeholder" in api_key.lower():
        result["status"] = "MISSING_KEY"
        result["error"] = "API key not configured in .env"
        return result

    client = get_client_for_role(role)
    start_time = time.time()
    try:
        # Minimal probe call
        resp = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Reply with 'OK'."}],
            max_tokens=5,
            timeout=15.0
        )
        latency = time.time() - start_time
        result["latency_sec"] = latency
        result["status"] = "ONLINE"
    except Exception as e:
        latency = time.time() - start_time
        result["latency_sec"] = latency
        result["status"] = "ERROR"
        err_str = str(e)
        if "401" in err_str or "unauthorized" in err_str.lower() or "invalid api key" in err_str.lower():
            result["error"] = "401 Unauthorized (Invalid/Expired Key)"
        elif "404" in err_str:
            result["error"] = f"404 Model not found ({model_name})"
        elif "timeout" in err_str.lower():
            result["error"] = f"Timeout (>15s)"
        else:
            result["error"] = err_str[:60]

    return result


def validate_all_llms(print_table: bool = True) -> Tuple[bool, Dict[str, Dict[str, Any]]]:
    """
    Tests connectivity for all NIRNAY agent roles.
    Returns (all_passed, results_dict).
    """
    roles = ["orchestrator", "environment", "blue_team", "red_team", "evaluation"]
    results = {}
    all_passed = True

    if print_table:
        console.print("\n[bold cyan]=== NIRNAY LLM Connectivity Check ===[/bold cyan]")
        console.print("[dim]Testing connection to NVIDIA NIM endpoints...[/dim]\n")

    for role in roles:
        res = validate_single_role(role)
        results[role] = res
        if res["status"] != "ONLINE":
            all_passed = False

    if print_table:
        table = Table(title="Agent LLM Endpoints Status", show_header=True, header_style="bold magenta")
        table.add_column("Agent Role", style="bold")
        table.add_column("Env Var", style="cyan")
        table.add_column("Key Status", style="dim")
        table.add_column("Target Model", style="blue")
        table.add_column("Status", justify="center")
        table.add_column("Latency / Details")

        for role, res in results.items():
            if res["status"] == "ONLINE":
                status_badge = "[bold green]ONLINE[/bold green]"
                detail = f"{res['latency_sec']:.2f}s"
            elif res["status"] == "MISSING_KEY":
                status_badge = "[bold yellow]NO KEY[/bold yellow]"
                detail = res["error"]
            else:
                status_badge = "[bold red]FAILED[/bold red]"
                detail = f"[red]{res['error']}[/red]"

            table.add_row(
                role.capitalize(),
                res["env_var"],
                res["key_preview"],
                res["model"].split("/")[-1],
                status_badge,
                detail
            )

        console.print(table)
        
        if not all_passed:
            console.print("\n[bold yellow][!] NOTICE:[/bold yellow] One or more LLM endpoints are unreachable.")
            console.print("    To use live AI models, please generate fresh API keys at [link=https://build.nvidia.com]build.nvidia.com[/link] and update `.env`.")
            console.print("    Deterministic fallback engines will be used where LLM calls fail.\n")
        else:
            console.print("\n[bold green][SUCCESS] All Agent LLM endpoints are active and responding![/bold green]\n")

    return all_passed, results


if __name__ == "__main__":
    validate_all_llms(print_table=True)
