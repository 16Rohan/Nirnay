import os
from dotenv import load_dotenv
load_dotenv()
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("ORCHESTRATOR_API_KEY"),
    timeout=15.0
)

print("Testing direct chat completion...")
try:
    completion = client.chat.completions.create(
        model="mistralai/mistral-7b-instruct-v0.3",
        messages=[{"role": "user", "content": "Respond with OK"}],
        max_tokens=10
    )
    print("Success:", completion.choices[0].message.content)
except Exception as e:
    print("Direct call failed:", e)
