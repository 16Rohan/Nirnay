import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("ORCHESTRATOR_API_KEY"),
    timeout=5.0
)

models = [m.id for m in client.models.list().data]

candidates = [
    m for m in models 
    if any(k in m.lower() for k in ["meta/", "nvidia/llama", "mistral", "gemma-3", "nemotron"])
]
print("Testing", len(candidates), "candidates...")

working = []
for m in candidates:
    try:
        resp = client.chat.completions.create(
            model=m,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=3
        )
        print("WORKS:", m)
        working.append(m)
        if len(working) >= 3:
            break
    except Exception:
        pass

print("Working models:", working)
