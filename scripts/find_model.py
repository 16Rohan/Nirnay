import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("ORCHESTRATOR_API_KEY"),
    timeout=10.0
)

models = [m.id for m in client.models.list().data]
print("Found", len(models), "models.")
print("\nFirst 15 models:")
for m in models[:15]:
    print(" -", m)

# Let's test the first few models to see which one works
for m in models[:5]:
    try:
        print(f"Testing model: {m}...")
        resp = client.chat.completions.create(
            model=m,
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=5
        )
        print(" -> WORKS! Output:", resp.choices[0].message.content)
        break
    except Exception as e:
        print(" -> FAILED:", e)
