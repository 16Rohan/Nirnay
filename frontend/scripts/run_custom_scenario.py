"""
NIRNAY Custom Scenario Test CLI
Allows testing arbitrary human strategic objectives, constraints, and guidance.
"""

import sys
import argparse
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.orchestration.graph import create_wargame_graph
from backend.orchestration.state import WargameState

console = Console(force_terminal=True)


def main():
    parser = argparse.ArgumentParser(description="NIRNAY Custom Scenario Test Script")
    parser.add_argument("--scenario-id", type=str, default="1", help="Starting scenario logical ID")
    parser.add_argument("--objective", type=str, default="Secure Logistics Point Alpha and deter enemy river crossing", help="Human objective text")
    parser.add_argument("--guidance", type=str, default="Fortify defensive positions; avoid cross-border strikes", help="Operator guidance text")
    parser.add_argument("--max-iterations", type=int, default=2, help="Number of scenario iterations (lineage)")
    args = parser.parse_args()

    console.print(Panel(
        f"[bold yellow]Starting Scenario ID:[/bold yellow] {args.scenario_id}\n"
        f"[bold yellow]Human Strategic Objective:[/bold yellow] {args.objective}\n"
        f"[bold yellow]Operator Guidance:[/bold yellow] {args.guidance}\n"
        f"[bold yellow]Max Iterations:[/bold yellow] {args.max_iterations}",
        title="[bold green]NIRNAY CUSTOM SCENARIO TEST RUNNER[/bold green]",
        border_style="green",
        box=box.ASCII
    ))

    app = create_wargame_graph()
    initial_state = WargameState(
        scenario_id=args.scenario_id,
        parent_scenario_id=None,
        iteration_count=1,
        max_iterations=args.max_iterations,
        human_guidance=f"{args.objective}. Guidance: {args.guidance}"
    )

    logged_index = 0
    final_state = None

    for step_output in app.stream(initial_state, stream_mode="values"):
        curr_state = WargameState.model_validate(step_output)
        final_state = curr_state

        new_logs = curr_state.step_logs[logged_index:]
        for log in new_logs:
            if "[MEMORY]" in log:
                console.print(f"[bold magenta]{log}[/bold magenta]")
            elif "[ORCHESTRATOR]" in log:
                console.print(f"[bold blue]{log}[/bold blue]")
            elif "[VALIDATION]" in log:
                console.print(f"[bold green]{log}[/bold green]")
            elif "[SCENARIO GENERATOR]" in log:
                console.print(f"[bold cyan]{log}[/bold cyan]")
            elif "[ENVIRONMENT]" in log:
                console.print(f"[bold yellow]{log}[/bold yellow]")
            elif "[BLUE TEAM]" in log:
                console.print(f"[bold dodger_blue1]{log}[/bold dodger_blue1]")
            elif "[RED TEAM]" in log:
                console.print(f"[bold red]{log}[/bold red]")
            elif "[SIMULATOR]" in log:
                console.print(f"[bold green3]{log}[/bold green3]")
            elif "[EVALUATION]" in log:
                console.print(f"[bold purple]{log}[/bold purple]")
            elif "[PERSISTENT MEMORY]" in log:
                console.print(f"[bold dark_orange]{log}[/bold dark_orange]")
            else:
                console.print(log)
            logged_index += 1

        if curr_state.simulation_output and curr_state.evaluation_output:
            sim = curr_state.simulation_output
            ev = curr_state.evaluation_output
            tbl = Table(title=f"Cycle Result: Scenario {curr_state.scenario_id}", box=box.ASCII)
            tbl.add_column("Property", style="bold cyan")
            tbl.add_column("Value", style="bold white")
            tbl.add_row("Status", sim.status)
            tbl.add_row("Condition", sim.termination.condition)
            tbl.add_row("Blue Loss", f"{sim.metrics.get('blue', {}).get('losses_percentage')}%")
            tbl.add_row("Red Loss", f"{sim.metrics.get('red', {}).get('losses_percentage')}%")
            tbl.add_row("Continuation", "CONTINUE" if not ev.simulation_control.concluded else "CONCLUDED")
            console.print("\n")
            console.print(tbl)
            console.print("\n")

    if final_state and final_state.strategic_report:
        console.print(Panel(
            final_state.strategic_report,
            title="[bold yellow]STRATEGIC DECISION SUPPORT REPORT[/bold yellow]",
            border_style="yellow",
            box=box.ASCII
        ))


if __name__ == "__main__":
    main()
