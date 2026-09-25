# NIRNAY

## Research-to-Agent Knowledge Integration & Intelligence Uncertainty Layer

**Document Type:** Product Requirements Document
**Repository:** Existing NIRNAY / Wargaming-AI repository
**Implementation Phase:** Research → Agent Knowledge → Prompt Integration
**Status:** Implementation Specification

---

# 1. Objective

Implement the first stage of integrating the completed wargaming research into NIRNAY's agent architecture.

The immediate objective is **not** to rewrite the agents or simulation engine.

The objective is to:

1. Read and interpret the existing `research.md`.
2. Extract research-backed wargaming principles relevant to each NIRNAY agent.
3. Create structured, agent-specific knowledge files.
4. Create a mapping between research findings and where they belong in the NIRNAY architecture.
5. Define a common framework for handling uncertainty through **intelligence and information quality**, rather than automatically creating additional scenario branches.
6. Prepare the repository for a later phase in which these knowledge files are incorporated into agent system prompts.

The implementation must preserve the existing NIRNAY architecture and contracts.

---

# 2. Important Architectural Principle

Research knowledge must be separated from runtime scenario state.

NIRNAY has four fundamentally different information layers:

```text
RESEARCH KNOWLEDGE
      ↓
AGENT SYSTEM PRINCIPLES
      ↓
DYNAMIC SCENARIO CONTEXT
      ↓
DETERMINISTIC SIMULATION
```

Persistent memory is separate:

```text
PAST SCENARIO / EVENTS / DECISIONS
              ↓
       PERSISTENT MEMORY
              ↓
       ORCHESTRATOR CONTEXT
```

Research must **not** become simulation truth.

Research should inform how agents reason about scenarios.

---

# 3. Scope

## 3.1 In Scope

Create:

```text
backend/
└── knowledge/
    ├── research.md
    ├── agent_guidance/
    │   ├── orchestrator.md
    │   ├── environment.md
    │   ├── blue.md
    │   ├── red.md
    │   └── evaluation.md
    ├── agent_mapping.md
    └── uncertainty.md
```

The exact location of the existing `research.md` must be inspected first.

If `research.md` already exists at an appropriate repository location, do not duplicate it unnecessarily.

Create the following:

### Agent guidance

* `orchestrator.md`
* `environment.md`
* `blue.md`
* `red.md`
* `evaluation.md`

### Architecture mapping

* `agent_mapping.md`

### Shared uncertainty framework

* `uncertainty.md`

---

# 4. Explicit Non-Goals

This phase must **NOT**:

* rewrite the agent implementations
* modify system prompts
* modify LLM wrapper logic
* modify Pydantic contracts
* modify the Scenario Contract
* modify the simulation engine
* modify graph orchestration
* modify frontend code
* add Three.js
* add RAG
* add a vector database
* replace Markdown memory
* redesign the existing scenario generator
* introduce predefined strategy menus
* hard-code tactical strategies
* automatically create additional scenarios because of uncertainty
* modify existing API endpoints
* modify database architecture

This is a **knowledge extraction and architecture preparation phase**.

Do not make unrelated improvements while implementing this PRD.

---

# 5. Source of Truth

The primary research source is the existing:

```text
research.md
```

The coding agent must read the **entire file** before producing derived knowledge.

Do not assume that the filename alone identifies its location.

First inspect the repository.

If multiple research documents exist, identify which one is the current authoritative `research.md` and report the finding before implementation.

Do not silently merge unrelated research documents.

---

# 6. Research Preservation Rules

The derived knowledge files must preserve the distinction between:

### Documented fact

Something explicitly supported by the research.

### Research interpretation

An interpretation explicitly presented by the research.

### Architectural implication

A reasonable implication for NIRNAY derived from the research.

### Implementation proposal

A new design recommendation introduced by this PRD or the coding agent.

These must never be presented as though they are all equivalent.

Use explicit labels where useful:

```markdown
## Research Principle

...

## NIRNAY Architectural Implication

...

## Implementation Consideration

...
```

Do not fabricate research findings.

Do not introduce external military doctrine unless the research explicitly contains it.

---

# 7. Agent Knowledge Extraction

Each agent guidance file should answer:

1. What does the research say that is relevant to this agent?
2. What principles should this agent follow?
3. What information should this agent consider?
4. How should this agent reason under uncertainty?
5. What should this agent avoid assuming?
6. What implications does this have for its output?
7. Which research sections support these principles?

---

# 8. Orchestrator Guidance

Create:

```text
backend/knowledge/agent_guidance/orchestrator.md
```

The Orchestrator guidance should focus on research-backed principles concerning:

* scenario construction
* objective definition
* constraints
* scenario realism
* scenario diversity
* adversarial interaction
* information uncertainty
* environmental variation
* temporal progression
* emergent events
* branching where appropriate
* maintaining coherent scenario state
* avoiding arbitrary scenario generation
* ensuring that generated scenarios remain internally consistent

The Orchestrator must not receive a fixed list such as:

```text
Attack
Defend
Fallback
Counterattack
Flank
```

Instead, research should be converted into **decision dimensions and scenario design principles**.

For example:

```text
objective priority
resource availability
time pressure
information quality
environmental conditions
risk tolerance
force posture
uncertainty
initiative
constraints
```

These are dimensions, not predefined strategies.

The model should generate the strategy.

---

# 9. Environment Agent Guidance

Create:

```text
backend/knowledge/agent_guidance/environment.md
```

The Environment Agent guidance should cover research-supported considerations concerning:

* terrain
* weather
* visibility
* infrastructure
* mobility
* environmental constraints
* temporal conditions
* environmental uncertainty
* effects of environmental conditions on available information
* interaction between environment and simulation

The Environment Agent should distinguish:

```text
known environmental condition
estimated condition
uncertain condition
unknown condition
```

It should not invent precise environmental facts when the scenario does not provide them.

---

# 10. Blue Team Guidance

Create:

```text
backend/knowledge/agent_guidance/blue.md
```

The Blue Team guidance should extract research-supported principles concerning:

* objective achievement
* resource allocation
* information quality
* uncertainty
* risk
* trade-offs
* adaptation
* contingency planning
* adversarial reasoning
* preservation of optionality
* reaction to new intelligence

Do not encode fixed Blue strategies.

Instead, define the **decision factors** Blue should consider.

The agent should be allowed to produce different strategies depending on:

```text
objective
constraints
resources
environment
information quality
Red behavior
time pressure
risk
uncertainty
human guidance
```

---

# 11. Red Team Guidance

Create:

```text
backend/knowledge/agent_guidance/red.md
```

The Red Team guidance should focus on research-supported principles concerning:

* adversarial thinking
* challenging assumptions
* exploiting weaknesses
* adapting to Blue behavior
* deception or uncertainty where supported by the research
* alternative courses of action
* resource constraints
* information asymmetry
* unexpected responses
* avoiding predictable behavior

Red must not be given a fixed menu of tactics.

Red should reason from the current scenario state.

The Red agent's purpose is to provide a credible adversarial response, not to generate a predetermined “enemy strategy.”

---

# 12. Evaluation Agent Guidance

Create:

```text
backend/knowledge/agent_guidance/evaluation.md
```

The Evaluation guidance should extract principles concerning:

* objective achievement
* resource effects
* risks
* trade-offs
* uncertainty
* consequences
* second-order effects
* strategic implications
* comparison of alternatives
* sensitivity to information quality
* distinguishing observed outcomes from inferred explanations

Evaluation must clearly distinguish:

```text
Simulation Result
        ↓
Observed Consequence
        ↓
Interpretation
        ↓
Strategic Implication
```

The Evaluation Agent must not claim that an outcome occurred if it was not produced by the deterministic simulator.

---

# 13. Intelligence-Based Uncertainty Framework

Create:

```text
backend/knowledge/uncertainty.md
```

This is a major requirement.

NIRNAY should represent uncertainty through **intelligence quality and information state**, rather than automatically creating multiple scenarios.

The fundamental principle is:

> Uncertainty is an information problem before it is a scenario problem.

---

# 14. Uncertainty Representation

The system should conceptually distinguish:

```text
KNOWN
ESTIMATED
REPORTED
UNCERTAIN
CONFLICTING
UNKNOWN
```

For example:

```text
KNOWN:
Blue logistics point is located at LOG-ALPHA.

ESTIMATED:
Red force strength is approximately 100–120.

REPORTED:
An external source reports increased Red activity.

CONFLICTING:
Two intelligence sources provide different estimates.

UNKNOWN:
Red reinforcement timing is unknown.
```

Do not collapse these states into a single confidence score.

---

# 15. Intelligence Record

The uncertainty framework should define a conceptual intelligence record such as:

```json
{
  "intelligence_id": "INT-001",
  "subject": "red_force_strength",
  "claim": "Red force strength is approximately 100-120",
  "status": "ESTIMATED",
  "confidence": 0.68,
  "source_ids": [
    "SRC-001"
  ],
  "age": "recent",
  "independent_corroboration": false,
  "information_gap": false,
  "decision_relevance": "high"
}
```

This is a conceptual knowledge representation.

Do not modify the existing runtime schema unless explicitly instructed in a later implementation phase.

---

# 16. Intelligence Instead of Scenario Splitting

The system should NOT do this:

```text
Unknown Red strength
        ↓
Scenario 1: Red = 100
Scenario 2: Red = 150
Scenario 3: Red = 200
```

unless a later what-if analysis explicitly requests those branches.

Instead:

```text
Unknown Red strength
        ↓
Intelligence Gap
        ↓
Decision identifies information requirement
        ↓
Intelligence collection / update
        ↓
Confidence changes
        ↓
Strategy adapts
```

This allows the simulation to remain a single coherent scenario while information evolves.

---

# 17. Intelligence Cycle

The conceptual intelligence loop should be:

```text
OBSERVE
   ↓
COLLECT
   ↓
ASSESS
   ↓
CORROBORATE
   ↓
UPDATE INFORMATION STATE
   ↓
IDENTIFY GAPS
   ↓
DECIDE WHETHER INFORMATION MATTERS
   ↓
ADAPT DECISION
```

The system should support the idea that agents can ask:

> “What information would most reduce the uncertainty relevant to this decision?”

This is preferable to simply asking:

> “What are all possible values?”

---

# 18. Decision-Relevant Uncertainty

Not every uncertainty matters equally.

Each uncertainty should conceptually be assessed by:

```text
Uncertainty
    ↓
Does it affect the current decision?
    ↓
NO → retain as background uncertainty
YES
    ↓
Could additional intelligence materially reduce it?
    ↓
NO → account for uncertainty in decision
YES
    ↓
Define information requirement
```

This creates a distinction between:

### Information uncertainty

“We do not know X.”

and:

### Decision uncertainty

“Different possible values of X could change our decision.”

Only the second necessarily requires immediate attention.

---

# 19. Intelligence Requirements

Agents should be able to identify information requirements such as:

```text
IR-001
Question:
What is the likely strength of the opposing force?

Why it matters:
May affect resource allocation.

Current information:
Estimated.

Confidence:
0.62.

Decision affected:
Forward deployment.

Priority:
High.
```

Again, this is a conceptual framework at this stage.

Do not implement a new database or API for this requirement.

---

# 20. Intelligence Updates

When new information becomes available, the system should conceptually perform:

```text
Existing belief
      +
New intelligence
      ↓
Information assessment
      ↓
Corroboration / conflict detection
      ↓
Updated information state
      ↓
Agent reconsideration
```

The system must not silently overwrite previous information.

For example:

```text
Previous:
Red strength estimated 100–120.

New report:
Red strength estimated 140–160.

Result:
CONFLICTING / UPDATED ESTIMATE

Not:
Red strength = 150
```

unless the evidence supports that conclusion.

---

# 21. Conflicting Intelligence

Conflicting intelligence must be preserved.

Example:

```text
Source A:
Red force strength ≈ 100.

Source B:
Red force strength ≈ 150.

Current assessment:
Conflicting estimates.

Confidence:
Low-to-moderate.

Information gap:
Yes.
```

The agent may then determine:

```text
Decision implication:
Avoid committing resources based on the assumption that the lower estimate is correct.
```

The system should not arbitrarily choose one source merely because it appeared later.

Source quality, recency, corroboration and relevance should be considered according to the research and existing provenance framework.

---

# 22. Intelligence Should Affect Agent Decisions

The uncertainty framework should eventually allow this pattern:

```text
Scenario State
      ↓
Current Intelligence
      ↓
Agent Assessment
      ↓
Decision
      ↓
Simulation
      ↓
New Evidence / Events
      ↓
Updated Intelligence
      ↓
Agent Reassessment
```

This creates a more realistic closed loop than:

```text
Scenario
→ Strategy
→ Simulation
→ Result
```

The intended architecture becomes:

```text
Scenario
→ Intelligence State
→ Agent Decision
→ Adversarial Response
→ Simulation
→ New Information
→ Evaluation
→ Intelligence Update
→ Next Decision
```

---

# 23. Research-to-Architecture Mapping

Create:

```text
backend/knowledge/agent_mapping.md
```

The mapping must identify where each major research finding belongs.

Use a structure similar to:

| Research Topic             | Relevant Agent  | Destination              | Purpose                     |
| -------------------------- | --------------- | ------------------------ | --------------------------- |
| Wargaming principles       | All             | System Prompt            | Stable reasoning principles |
| Scenario design            | Orchestrator    | System Prompt            | Scenario generation         |
| Terrain effects            | Environment     | System Prompt            | Environmental reasoning     |
| Adversarial reasoning      | Red             | System Prompt            | Opposing adaptation         |
| Decision trade-offs        | Blue            | System Prompt            | Strategy generation         |
| Outcome adjudication       | Evaluation      | System Prompt            | Interpretation              |
| Current terrain            | Environment     | Dynamic Context          | Scenario-specific           |
| Current Blue state         | Blue            | Dynamic Context          | Scenario-specific           |
| Current Red state          | Red             | Dynamic Context          | Scenario-specific           |
| Simulation result          | Evaluation      | Dynamic Context          | Runtime result              |
| Historical decisions       | Relevant agents | Persistent Memory        | Previous context            |
| Intelligence claims        | Relevant agents | Dynamic Context / Memory | Information state           |
| Deterministic combat rules | Simulator       | Simulation Rules         | Execution                   |
| Visualization principles   | Frontend        | UI                       | Representation              |

The actual mapping must be derived from `research.md`, not blindly copied from this example.

---

# 24. Stable Knowledge vs Dynamic Context

The coding agent must explicitly identify which research findings belong in:

## System Prompt

Stable principles.

Examples:

```text
reason under uncertainty
consider trade-offs
challenge assumptions
consider adversarial adaptation
distinguish evidence from inference
```

## Dynamic Context

Scenario-specific information.

Examples:

```text
current weather
current force state
current intelligence
current resources
current objectives
current events
```

## Persistent Memory

Historical information.

Examples:

```text
previous decisions
previous simulation results
previous intelligence assessments
unresolved information gaps
human decisions
```

## Simulation Rules

Deterministic mechanics.

Examples:

```text
movement calculations
resource depletion
detection mechanics
attrition rules
```

Research must not be allowed to blur these boundaries.

---

# 25. No Fixed Strategy Menus

A key architectural requirement is to avoid hard-coded strategy choices such as:

```text
1. Frontline Attack
2. Defensive Posture
3. Reprisal and Fallback
4. Flanking Maneuver
```

These reduce the agent to selecting from developer-written strategies.

Instead provide decision dimensions.

Example:

```text
Objective Priority
Resource Preservation
Time Pressure
Information Quality
Risk Exposure
Initiative
Defensive Depth
Adaptability
Escalation Sensitivity
Contingency Readiness
```

The agent must generate its own course of action based on these dimensions and the actual scenario.

---

# 26. Scenario Diversity

The research-derived knowledge must support scenario diversity without requiring arbitrary randomness.

Relevant dimensions may include:

```text
Terrain
Weather
Visibility
Infrastructure
Time Pressure
Resource Availability
Force Composition
Information Quality
Intelligence Confidence
Starting Conditions
Objectives
Constraints
Environmental Events
Adversary Behaviour
Third-Party Factors
```

The final list must be based on the research and existing NIRNAY design.

Scenario diversity should arise from meaningful changes in conditions, not merely random numbers.

---

# 27. Emergent Events

Research findings concerning emergent events should be extracted where supported.

Events should be treated as:

```text
Scenario Condition
        ↓
Simulation / Agent Interaction
        ↓
Event
        ↓
Information Update
        ↓
Agent Adaptation
```

An emergent event should not exist solely to make the scenario more interesting.

It should have a reason within the scenario model.

---

# 28. What-If Branching

Scenario branching remains supported, but it is **not the default mechanism for uncertainty**.

Use branching when the purpose is explicitly:

```text
Compare alternative decisions
```

rather than:

```text
Represent lack of knowledge
```

Example:

```text
Scenario 1
   ├── COA A
   ├── COA B
   └── COA C
```

This is a decision comparison.

Whereas:

```text
Red strength unknown
```

should normally remain an intelligence uncertainty within one scenario.

---

# 29. Context Window Strategy

The project may have access to large context windows.

Do not interpret this as:

> Put the entire repository and all historical information into every agent prompt.

Instead:

```text
Large Context Capacity
        ↓
More relevant context
        ↓
Not more irrelevant context
```

Agents should receive:

1. relevant research principles
2. relevant current scenario state
3. relevant intelligence
4. relevant persistent memory
5. relevant human guidance
6. relevant simulation results

The system should still use context selection.

---

# 30. Knowledge File Format

Each knowledge file should use a consistent Markdown structure:

```markdown
# Agent Knowledge: <Agent>

## Purpose

## Research-Derived Principles

## Decision Considerations

## Information and Uncertainty

## Agent-Specific Guidance

## What the Agent Must Not Assume

## Implications for Agent Output

## Research References

## Architectural Notes
```

The exact sections may be adjusted if the research requires it.

---

# 31. Research References

Every substantive principle derived from research should retain a traceable reference.

For example:

```markdown
## Research References

- research.md, Section: <section name>
- research.md, subsection: <subsection>
```

If the research already contains source citations, preserve them.

Do not strip provenance during summarization.

---

# 32. Agent Mapping Requirements

`agent_mapping.md` must contain:

### Research topic

What was found.

### Relevant agents

Which agents need it.

### Knowledge type

One of:

```text
SYSTEM_PROMPT
DYNAMIC_CONTEXT
PERSISTENT_MEMORY
SIMULATION_RULE
EVALUATION
UI
EXTERNAL_KNOWLEDGE
NOT_IMPLEMENTED
```

### Rationale

Why it belongs there.

### Implementation status

```text
EXTRACTED
READY_FOR_PROMPT_INTEGRATION
DEFERRED
REQUIRES_RESEARCH
```

---

# 33. Uncertainty File Requirements

`uncertainty.md` must document:

1. uncertainty categories
2. intelligence states
3. information requirements
4. confidence
5. source quality
6. corroboration
7. conflicting information
8. stale information
9. decision relevance
10. information gaps
11. intelligence updates
12. decision adaptation
13. distinction between uncertainty and scenario branching

It should include examples using **synthetic NIRNAY scenarios only**.

Do not use real-world operational military examples.

---

# 34. Implementation Workflow

The coding agent must execute the following sequence.

### Step 1

Inspect the repository.

Identify:

* current `research.md`
* current agent implementations
* current prompt locations
* current contracts
* current memory architecture

Do not modify anything yet.

### Step 2

Read the complete `research.md`.

### Step 3

Extract research themes.

### Step 4

Map themes to agents.

### Step 5

Create the five agent guidance files.

### Step 6

Create `agent_mapping.md`.

### Step 7

Create `uncertainty.md`.

### Step 8

Review for unsupported claims.

### Step 9

Verify that no fixed strategy menu has been introduced.

### Step 10

Verify that uncertainty is represented as intelligence/information state rather than automatic scenario branching.

### Step 11

Report all generated files and any unresolved ambiguities.

---

# 35. Code Modification Restriction

For this phase:

**Only knowledge/documentation files may be added or modified.**

Do not modify:

```text
*.py
*.ts
*.tsx
*.json
*.yaml
*.yml
```

unless a pre-existing knowledge file itself requires a non-code format and this PRD explicitly permits it.

Do not modify:

* agent code
* prompts embedded in code
* contracts
* graph
* simulation
* frontend
* APIs
* database
* dependencies
* environment files

---

# 36. Validation Checklist

Before finishing, verify:

### Research

* [ ] Entire `research.md` was read.
* [ ] No unsupported research claims were introduced.
* [ ] Research provenance was preserved.
* [ ] Research and architectural interpretation are distinguishable.

### Agent Knowledge

* [ ] Orchestrator guidance exists.
* [ ] Environment guidance exists.
* [ ] Blue guidance exists.
* [ ] Red guidance exists.
* [ ] Evaluation guidance exists.

### Architecture

* [ ] `agent_mapping.md` exists.
* [ ] Stable knowledge is separated from dynamic context.
* [ ] Persistent memory remains historical state.
* [ ] Simulation rules remain deterministic.

### Uncertainty

* [ ] Uncertainty framework exists.
* [ ] Intelligence states are defined.
* [ ] Information gaps are represented.
* [ ] Conflicting intelligence is preserved.
* [ ] Source quality is considered.
* [ ] Decision relevance is considered.
* [ ] Intelligence can conceptually update agent decisions.
* [ ] Uncertainty does not automatically cause scenario splitting.

### Strategy

* [ ] No fixed strategy menus were introduced.
* [ ] Decision dimensions are used instead.
* [ ] Agents retain freedom to generate their own strategies.

### Repository Safety

* [ ] No Python files changed.
* [ ] No frontend files changed.
* [ ] No contracts changed.
* [ ] No simulation logic changed.
* [ ] No dependencies changed.

---

# 37. Expected Output

At completion, the coding agent should report:

```text
Research Integration Complete

Created:
- backend/knowledge/agent_guidance/orchestrator.md
- backend/knowledge/agent_guidance/environment.md
- backend/knowledge/agent_guidance/blue.md
- backend/knowledge/agent_guidance/red.md
- backend/knowledge/agent_guidance/evaluation.md
- backend/knowledge/agent_mapping.md
- backend/knowledge/uncertainty.md

Modified:
- <existing research file only, if necessary>

Code changes:
- None

Prompt changes:
- None

Contract changes:
- None

Simulation changes:
- None

Unresolved questions:
- ...
```

Also provide a concise summary of:

1. major research principles extracted
2. major differences between agent roles
3. uncertainty model
4. research-to-architecture mapping
5. anything that could not be confidently derived from `research.md`

---

# 38. Definition of Done

This phase is complete when:

```text
research.md
     ↓
Research Extraction
     ↓
Agent Knowledge
     ↓
Architecture Mapping
     ↓
Intelligence / Uncertainty Framework
     ↓
Human Review
```

The repository must be ready for the **next phase**:

```text
Agent Knowledge
     ↓
System Prompt Integration
     ↓
Dynamic Context Integration
     ↓
Runtime Validation
```

Do not perform that next phase in this task.

---

# 39. Core Design Principle

The implementation should preserve the following NIRNAY philosophy:

> The agent should not be told what strategy to choose. It should be given the principles, information, constraints, uncertainty and objectives required to generate a strategy.

And for uncertainty:

> NIRNAY should not create a new world merely because it does not know something about the current world. It should represent the uncertainty, identify whether the uncertainty matters, determine what intelligence could reduce it, and allow the agents to adapt as information changes.

And for architecture:

> Research defines how the agents should reason. Dynamic context defines what they are reasoning about. Intelligence defines what is known and unknown. The simulator defines what happens. Persistent memory records what happened.

---

# 40. Final Instruction to Coding Agent

Treat this PRD as an implementation specification.

Before modifying files, inspect the repository and locate the actual research file and existing architecture.

Use the existing NIRNAY terminology wherever possible.

Do not redesign the system.

Do not add speculative architecture.

Do not implement future phases.

Do not turn research into hard-coded strategies.

Do not turn uncertainty into automatic scenario branching.

Build the **research-derived knowledge layer and intelligence-based uncertainty framework only**, then stop and report the result for human review.