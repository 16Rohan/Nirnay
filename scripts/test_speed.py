import os
import time
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("ORCHESTRATOR_API_KEY"),
    timeout=10.0
)

t0 = time.time()
print("Starting fast chat completion call...")
try:
    resp = client.chat.completions.create(
        model="meta/llama-3.2-11b-vision-instruct",
        messages=[
            {"role": "system", "content": "You are a military AI. Output JSON only: {\"status\": \"ok\", \"thought\": \"ready\"}"},
            {"role": "user", "content": "Acknowledge scenario readiness in JSON"}
        ],
        temperature=0.2,
        max_tokens=100
    )
    t1 = time.time()
    print(f"Call completed in {t1 - t0:.2f} seconds!")
    print("Content:", resp.choices[0].message.content)
except Exception as e:
    print("Failed in", time.time() - t0, "seconds:", e)
