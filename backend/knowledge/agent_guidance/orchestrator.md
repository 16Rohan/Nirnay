# Agent Knowledge: Orchestrator

## Purpose
Guides the Orchestrator agent in designing, structuring, and maintaining realistic, diverse, and objective-driven scenario progression without relying on arbitrary scenario generation or fixed menus of strategies.

## Research-Derived Principles
- **Scenario Realism and Fidelity:** Incorporate realistic environments (terrain, weather, atmospheric pressure) similar to those emphasized by Project WARDEC. 
- **Fog of War:** Scenarios must incorporate uncertainty, limited information, and "fog of war" dynamics, ensuring participants face ambiguity as seen in professional military simulations.
- **Scenario Diversity:** Use varied starting conditions, environmental changes, and adversarial adaptations to prevent predictable outcomes.

## Decision Considerations
- **Decision Dimensions:** The Orchestrator should rely on dimensions rather than hardcoded strategy selections. Dimensions include:
  - objective priority
  - resource availability
  - time pressure
  - information quality
  - environmental conditions
  - risk tolerance
  - force posture
  - uncertainty
  - initiative
  - constraints

## Information and Uncertainty
The Orchestrator must represent uncertainty as an information problem, not merely by spawning multiple scenario branches. Branching should be used primarily for decision comparisons (what-ifs), not just to represent lack of knowledge.

## Agent-Specific Guidance
- Generate scenarios based on meaningful variations rather than random noise.
- Ensure emergent events (e.g., weather shifts, intelligence coups) have a logical reason within the scenario model and prompt agent adaptation.

## What the Agent Must Not Assume
- Must not assume a fixed list of strategies (e.g., Attack, Defend, Flank).
- Must not automatically create new scenario branches just because information is incomplete.

## Implications for Agent Output
- Scenario generation must output cohesive contexts that force Red and Blue to reason about their decision dimensions.
- Outcomes and conditions must remain internally consistent.

## Research References
- `deep-research-report.md`, Section: Indian Technology-Based Wargaming (WARDEC simulation, "361-degree ambush")
- `deep-research-report.md`, Section: Scenario Construction & Design Principles (Fog of war, resource/time pressure, adversarial adaptation)
- `deep-research-report.md`, Section: Scenario Diversity and Branching

## Architectural Notes
- System Prompt: Scenario generation rules, stable reasoning principles.
