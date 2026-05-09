"""
Quick end-to-end test of the full 6-agent pipeline.
Run from: d:\Ai2\truthlens\backend
"""
import asyncio, os, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env')

TEST_TEXT = "Scientists confirm drinking hot water cures cancer, WHO endorses new miracle therapy."

async def main():
    print(f"Testing: {TEST_TEXT[:60]}...\n")

    # Test Groq directly
    print("--- Groq ---")
    try:
        from app.services.llm_service import call_llm
        r = await call_llm("Reply with one word: working")
        print(f"Groq: {r.strip()}")
    except Exception as e:
        print(f"Groq FAILED: {e}")

    # Test HF sentiment
    print("--- HF Sentiment ---")
    try:
        from app.services.huggingface_service import get_sentiment
        r = await get_sentiment(TEST_TEXT)
        print(f"Sentiment: {r}")
    except Exception as e:
        print(f"HF Sentiment FAILED: {e}")

    # Test HF similarity
    print("--- HF Similarity ---")
    try:
        from app.services.huggingface_service import get_semantic_similarity
        r = await get_semantic_similarity(TEST_TEXT, "WHO has found no cure for cancer")
        print(f"Similarity: {r:.3f}")
    except Exception as e:
        print(f"HF Similarity FAILED: {e}")

    # Test full pipeline via API
    print("\n--- Full Pipeline ---")
    import httpx
    async with httpx.AsyncClient(timeout=90) as c:
        try:
            r = await c.post(
                "http://localhost:8000/analyze-text",
                json={"text": TEST_TEXT, "language": "en"}
            )
            d = r.json()
            print(f"Verdict:           {d.get('verdict')}")
            print(f"Authenticity:      {d.get('authenticityScore')}")
            print(f"Category:          {d.get('category')}")
            print(f"Confidence:        {d.get('confidenceScore')}")
            print(f"Status:            {d.get('status', 'ok')}")
            print(f"Explanation:       {str(d.get('explanation',''))[:120]}")
        except Exception as e:
            print(f"Pipeline FAILED: {e}")

asyncio.run(main())
