"""
Scenario presets for the NIRNAY Strategic Wargaming Platform.
Provides predefined operational templates for wargame sessions.
"""

from typing import Dict, List, Any
from pydantic import BaseModel, Field


class ScenarioPreset(BaseModel):
    preset_id: str
    name: str
    theater: str
    description: str
    default_objective: str
    default_constraints: str
    turn_durations_supported: List[str] = Field(default_factory=lambda: ["30s", "1m", "5m"])
    forces_summary: Dict[str, Any] = Field(default_factory=dict)
    terrain: str
    initial_weather: str


PRESETS: Dict[str, ScenarioPreset] = {
    "DEMO-001": ScenarioPreset(
        preset_id="DEMO-001",
        name="Operation Resolve - Eastern Valley Standoff",
        theater="Eastern Valley Corridor",
        description=(
            "Adversary 4th Armored Column advancing toward River Crossing LOC-BRAVO. "
            "Friendly 1st Mechanized Brigade tasked with defending Forward Logistics Point Alpha "
            "and deterring adversary crossing without violating border buffer."
        ),
        default_objective="Defend Forward Logistics Point Alpha, hold river crossing corridor, deter adversary penetration without violating border buffer.",
        default_constraints="No kinetic cross-border strikes; fuel floor must remain above 24 hours.",
        turn_durations_supported=["30s", "1m", "5m"],
        forces_summary={
            "blue": "1st Mechanized Brigade (94 units) at LOC-ALPHA",
            "red": "4th Armored Column (108 units) at LOC-BRAVO"
        },
        terrain="Valley Basin, Moderate traversability, River barrier",
        initial_weather="Degrading rain, 6.5km visibility, muddy trail mobility penalty"
    ),
    "BORDER-002": ScenarioPreset(
        preset_id="BORDER-002",
        name="Northern Salients Border Shield",
        theater="High-Altitude Mountain Pass",
        description=(
            "Adversary mountain recon battalions probing high-altitude perimeter passes. "
            "Blue mechanized infantry and mountain batteries must establish early-warning sensors "
            "and interdict ingress routes while avoiding escalatory engagements."
        ),
        default_objective="Establish observation posts along ridge line Bravo, prevent adversary ingress through pass, maintain strict rules of engagement.",
        default_constraints="Defensive fire only; no aircraft ingress past median coordinate line.",
        turn_durations_supported=["30s", "1m", "5m"],
        forces_summary={
            "blue": "3rd Mountain Brigade (78 units) at Ridgeline Alpha",
            "red": "7th Recon Battalions (85 units) at Northern Ingress"
        },
        terrain="Steep Alpine Ridge, Low traversability, Chokepoints",
        initial_weather="Freezing fog, 2.0km visibility, snow pack mobility penalty"
    ),
    "COASTAL-003": ScenarioPreset(
        preset_id="COASTAL-003",
        name="Littoral Bastion Defense",
        theater="Strait Archipelago",
        description=(
            "Adversary amphibious ready group maneuvering near offshore energy platforms. "
            "Blue coastal defense battery and surface combatants must maintain maritime exclusion zone."
        ),
        default_objective="Deny maritime ingress into Strait sector, protect critical energy infrastructure, conduct active electronic screening.",
        default_constraints="No engagement beyond 12nm territorial waters without human command verification.",
        turn_durations_supported=["30s", "1m", "5m"],
        forces_summary={
            "blue": "Coastal Defense Flotilla (6 vessels + 2 batteries)",
            "red": "Amphibious Task Unit (9 vessels)"
        },
        terrain="Archipelago, Shallow waters, Dispersed islets",
        initial_weather="High sea state, Gale warnings, Intermittent squalls"
    ),
}


def get_preset(preset_id: str) -> ScenarioPreset:
    """Retrieve a preset by ID, defaulting to DEMO-001 if not found."""
    return PRESETS.get(preset_id, PRESETS["DEMO-001"])


def list_presets() -> List[ScenarioPreset]:
    """List all available scenario presets."""
    return list(PRESETS.values())
