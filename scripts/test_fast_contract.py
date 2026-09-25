import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import os
import time
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI
from backend.schemas.contracts import ScenarioContract
from backend.llm.wrapper import extract_json_from_text

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("ORCHESTRATOR_API_KEY"),
    timeout=20.0
)

# Load clean template from contracts/scenario_contract.json
with open("contracts/scenario_contract.json", "r") as f:
    template = f.read()

system_prompt = f"""You are the ORCHESTRATOR AGENT of the NIRNAY Strategic Wargaming Platform.
Generate a valid Scenario Contract JSON matching this structure:
```json
{template}
```
Output valid JSON only. No explanations."""

user_prompt = "Create Scenario 1: Mountain Pass Relief Corridor. Objectives: Secure pass and protect humanitarian aid."

t0 = time.time()
print("Invoking NVIDIA NIM with compact template...")
resp = client.chat.completions.create(
    model="meta/llama-3.2-11b-vision-instruct",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    temperature=0.3,
    max_tokens=2048
)
t1 = time.time()
print(f"Response received in {t1 - t0:.2f} seconds!")
data = extract_json_from_text(resp.choices[0].message.content)
contract = ScenarioContract.model_validate(data)
print(f"Validated ScenarioContract successfully! ID={contract.scenario_id}, Title={contract.metadata.title}")
