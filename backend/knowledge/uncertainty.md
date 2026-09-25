# Intelligence-Based Uncertainty Framework

## Overview
Uncertainty is fundamentally an information problem, not a reason to artificially split scenarios into multiple branches. This framework represents uncertainty through intelligence quality and information state, driving agents to adapt based on what they know, what they estimate, and what they need to find out.

## Intelligence States
Information within the scenario is categorized into distinct states, which agents use to gauge confidence:
- **KNOWN:** A confirmed, ground-truth fact (e.g., "Blue logistics point is at LOG-ALPHA").
- **ESTIMATED:** An approximation based on available data (e.g., "Red force strength is 100-120").
- **REPORTED:** A claim from an external source requiring corroboration (e.g., "Local source reports increased movement").
- **UNCERTAIN:** Information that lacks sufficient detail or confidence.
- **CONFLICTING:** Multiple sources provide divergent information.
- **UNKNOWN:** A complete lack of information (e.g., "Timing of Red reinforcements").

## The Intelligence Loop
Agents conceptualize uncertainty management through the following cycle:
1. OBSERVE
2. COLLECT
3. ASSESS
4. CORROBORATE
5. UPDATE INFORMATION STATE
6. IDENTIFY GAPS
7. DECIDE WHETHER INFORMATION MATTERS (Decision Relevance)
8. ADAPT DECISION

## Information Requirements & Gaps
When facing uncertainty, agents should identify **Information Requirements (IRs)** instead of assuming all possible branches. 

**Example IR:**
- **Question:** What is the likely strength of the opposing force?
- **Why it matters:** May affect forward deployment strategy.
- **Current state:** Estimated (Conf: 0.62).
- **Priority:** High.

## Decision Relevance
Not every unknown fact matters. Agents must determine:
- **Information Uncertainty:** We don't know fact X.
- **Decision Uncertainty:** Different possible values of X would materially change our chosen strategy.
*Only Decision Uncertainty requires generating intelligence requirements.*

## Intelligence Updates & Conflicting Information
When new intelligence arrives, the system does not silently overwrite past data. Instead:
- Assess new intelligence against existing beliefs.
- Corroborate or identify conflict.
- Update information state (e.g., mark as CONFLICTING rather than adopting the newest value blindly).
Agents evaluate source quality, recency, and corroboration to resolve conflicts dynamically.

## Scenario Branching vs. Intelligence
- **Scenario Splitting (What-If):** Used explicitly to compare alternative decisions (e.g., comparing COA A vs COA B).
- **Intelligence Uncertainty:** Handled dynamically within a *single* scenario. Unknown enemy strength should lead to an information gap, intelligence collection, updated confidence, and strategy adaptation, rather than spawning three parallel simulation worlds.
