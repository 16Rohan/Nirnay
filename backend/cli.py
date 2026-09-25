"""
NIRNAY - Strategic Wargaming & Decision Intelligence Platform
CLI Demonstration Prototype
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 stdout on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich import box

# Ensure project root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.orchestration.graph import create_wargame_graph
from backend.orchestration.state import WargameState
from backend.llm.validate import validate_all_llms

console = Console(force_terminal=True)


def print_banner():
    banner = Text()
    banner.append("+----------------------------------------------------------+\n", style="bold cyan")
    banner.append("|                        NIRNAY                            |\n", style="bold white")
    banner.append("|       Autonomous Multi-Agent Strategic Wargaming         |\n", style="bold yellow")
    banner.append("|                   Decision Intelligence                  |\n", style="bold green")
    banner.append("+----------------------------------------------------------+", style="bold cyan")
    console.print(banner)
    console.print(
        Panel(
            "[bold white]Core Architecture Principle:[/bold white]\n"
            "[italic cyan]Agents reason. Deterministic systems execute. Persistent memory remembers. Humans remain in control.[/italic cyan]",
            border_style="blue",
            box=box.ASCII
        )
    )


def run_cli_prototype():
    print_banner()

    # Pre-flight LLM connectivity validation
    all_online, _ = validate_all_llms(print_table=True)

    initial_scenario = "1"
    human_objective = "Defend Forward Logistics Point Alpha, hold river crossing corridor, deter adversary penetration without violating border buffer."
    human_constraints = "No kinetic cross-border strikes; fuel floor must remain above 24 hours."

    console.print(Panel(
        f"[bold yellow]Scenario ID:[/bold yellow] {initial_scenario}\n"
        f"[bold yellow]Human Strategic Objective:[/bold yellow] {human_objective}\n"
        f"[bold yellow]Operational Constraints:[/bold yellow] {human_constraints}",
        title="[bold green]HUMAN OPERATOR STRATEGIC DIRECTIVE[/bold green]",
        border_style="green",
        box=box.ASCII
    ))

    console.print("\n[bold cyan]Initializing compiled multi-agent LangGraph workflow...[/bold cyan]\n")
    app = create_wargame_graph()

    initial_state = WargameState(
        scenario_id=initial_scenario,
        parent_scenario_id=None,
        iteration_count=1,
        max_iterations=2,
        human_guidance=human_objective
    )

    logged_step_index = 0

    # Stream the graph step by step for rich interactive feedback
    final_state = None
    for step_output in app.stream(initial_state, stream_mode="values"):
        current_state = WargameState.model_validate(step_output)
        final_state = current_state

        # Print new step logs
        new_logs = current_state.step_logs[logged_step_index:]
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
            logged_step_index += 1

        # Check if a simulation just resolved
        if current_state.simulation_output and current_state.evaluation_output:
            sim = current_state.simulation_output
            ev = current_state.evaluation_output

            # Render a summary table for the iteration
            table = Table(title=f"Simulation Cycle Outcome: Scenario {current_state.scenario_id}", box=box.ASCII)
            table.add_column("Dimension", style="bold cyan")
            table.add_column("Result / Metric", style="bold white")

            table.add_row("Status", f"[green]{sim.status}[/green]")
            table.add_row("Termination Condition", sim.termination.condition)
            table.add_row("Blue Casualties", f"{sim.metrics.get('blue', {}).get('losses_percentage')}%")
            table.add_row("Red Casualties", f"{sim.metrics.get('red', {}).get('losses_percentage')}%")

            obj_summary = ", ".join([f"{o.get('objective')}: {o.get('status')}" for o in sim.objective_results])
            table.add_row("Objective Status", obj_summary)

            if ev.emergent_events:
                emergent_desc = "; ".join([e.description for e in ev.emergent_events])
                table.add_row("Emergent Event", f"[yellow]{emergent_desc}[/yellow]")

            console.print("\n")
            console.print(table)
            console.print("\n")

    # Final Strategic Report
    if final_state and final_state.strategic_report:
        reports_dir = Path(__file__).resolve().parent.parent / "reports"
        reports_dir.mkdir(parents=True, exist_ok=True)
        report_file = reports_dir / "scenario_1_final.md"
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(final_state.strategic_report)

        console.print(Panel(
            f"[bold green]Strategic Assessment Successfully Generated![/bold green]\n\n"
            f"[bold white]Saved to:[/bold white] [cyan]{report_file}[/cyan]\n\n"
            f"{final_state.strategic_report[:600]}...\n[italic](full report written to disk)[/italic]",
            title="[bold yellow]FINAL STRATEGIC DECISION SUPPORT REPORT[/bold yellow]",
            border_style="yellow",
            box=box.ASCII
        ))

    console.print("\n[bold green][SUCCESS] Complete closed-loop NIRNAY workflow executed successfully![/bold green]\n")


if __name__ == "__main__":
    run_cli_prototype()
