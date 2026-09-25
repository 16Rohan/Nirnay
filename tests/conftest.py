import os
import pytest

@pytest.fixture(autouse=True)
def fast_fail_llm_for_tests():
    """
    Force fast failures and fallbacks during tests to prevent hanging 
    when the external LLM API is overloaded or unavailable.
    """
    orig_timeout = os.getenv("LLM_TIMEOUT")
    orig_retries = os.getenv("NUM_RETRIES")
    orig_fallback = os.getenv("ALLOW_FALLBACKS")

    # Set aggressive fast-fail for tests
    os.environ["LLM_TIMEOUT"] = "1.0"
    os.environ["NUM_RETRIES"] = "0"
    os.environ["ALLOW_FALLBACKS"] = "true"
    
    yield
    
    if orig_timeout is not None: 
        os.environ["LLM_TIMEOUT"] = orig_timeout
    if orig_retries is not None: 
        os.environ["NUM_RETRIES"] = orig_retries
    if orig_fallback is not None: 
        os.environ["ALLOW_FALLBACKS"] = orig_fallback
