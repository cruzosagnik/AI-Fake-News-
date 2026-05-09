import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.services.llm_service import call_llm
from app.services.huggingface_service import get_fakenews_signal

async def main():
    print("Testing Groq...")
    try:
        res = await call_llm("Say hello")
        print("Groq success:", res)
    except Exception as e:
        print("Groq error:", e)

    print("\nTesting HuggingFace...")
    try:
        res = await get_fakenews_signal("This is a test of a fake news article claiming the moon is made of cheese.")
        print("HuggingFace success:", res)
    except Exception as e:
        print("HuggingFace error:", e)

if __name__ == "__main__":
    asyncio.run(main())
