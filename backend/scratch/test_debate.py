import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

from app.agents.debate.debate_orchestrator import run_debate

async def main():
    text = "Breakthrough scientific study reveals that eating chocolate every day cures aging and guarantees a 120-year lifespan."
    print("Starting debate simulation...")
    res = await run_debate(text, rounds=1)
    print("\n--- DEBATE RESULTS ---")
    print(f"Final Verdict: {res.get('final_verdict')}")
    print(f"Authenticity Score: {res.get('authenticity_score')}")
    print(f"Rounds Conducted: {res.get('rounds_conducted')}")
    print(f"Incomplete: {res.get('incomplete_debate')}")
    print(f"Error: {res.get('error')}")
    
    print("\n--- TRANSCRIPT TURNS ---")
    for turn in res.get('debate_transcript', []):
        print(f"Turn {turn['turn']} [{turn['agent']} - {turn['role']}]:")
        print(turn['content'])
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())
