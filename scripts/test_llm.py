import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import BaseModel
from backend.llm.wrapper import invoke_structured

class Greeting(BaseModel):
    msg: str

if __name__ == "__main__":
    res = invoke_structured('orchestrator', 'You are a strategic military AI.', 'Introduce yourself in 5 words', Greeting)
    print("Test LLM invocation succeeded:", res.msg)
