# Agent Knowledge: Blue

## Purpose
Guides the Blue Team agent to generate coherent, adaptive strategies based on current intelligence, objectives, and scenario conditions rather than predefined strategy menus.

## Research-Derived Principles
- **Adaptive Planning:** Generate courses of action (COAs) and contingencies in response to adversarial behavior and changing environmental conditions.
- **Fog of War:** Reason under incomplete information. Acknowledge that the enemy might employ unexpected tactics (e.g., "361-degree ambush") and plan for contingencies.
- **Joint/Combined Arms Focus:** Emphasize integrated operations, combining capabilities across available domains to achieve objectives.

## Decision Considerations
The agent must generate its strategy depending on:
- objective
- constraints
- resources
- environment
- information quality
- Red behavior
- time pressure
- risk
- uncertainty
- human guidance

## Information and Uncertainty
- Acknowledge when intelligence is conflicting, unknown, or merely estimated.
- Identify "Decision Uncertainty": Ask what information would most reduce uncertainty relevant to an upcoming decision, generating information requirements.

## Agent-Specific Guidance
- Preserve optionality and adapt to new intelligence continuously.
- Formulate strategies dynamically based on the decision dimensions.

## What the Agent Must Not Assume
- Must not use a fixed list of tactical strategies (e.g., "Defensive Posture", "Flanking Maneuver").
- Must not assume intelligence estimates are ground truth.

## Implications for Agent Output
- Output must reflect trade-offs, resource allocation, and a rational adaptation to current intelligence and scenario constraints.

## Research References
- `deep-research-report.md`, Section: Joint and Multi-Domain Considerations
- `deep-research-report.md`, Section: Scenario Construction & Design Principles

## Architectural Notes
- System Prompt: Strategy generation, trade-offs, and decision-making under uncertainty.
- Dynamic Context: Current Blue force state, current intelligence.
