import asyncio, os, httpx
from dotenv import load_dotenv
load_dotenv('.env')

HF_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
HF_BASE = 'https://router.huggingface.co/hf-inference/models'
headers = {'Authorization': f'Bearer {HF_KEY}'}

async def test():
    # Test sentence similarity
    models = [
        ('sentence-transformers/all-MiniLM-L6-v2', {'inputs': {'source_sentence': 'hot water cures cancer', 'sentences': ['WHO confirms no cancer cure found']}}),
        ('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', {'inputs': {'source_sentence': 'test', 'sentences': ['test sentence']}}),
    ]
    print("=== Similarity Models ===")
    for m, payload in models:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f'{HF_BASE}/{m}', json=payload, headers=headers)
            print(f'{m}: {r.status_code} -> {str(r.text)[:100]}')
    
    # Test fake news models
    fake_models = [
        'hamzab/roberta-fake-news-classification',
        'GonzaloA/fake-news-detection', 
        'jy46604790/Fake-News-Bert-Detect',
        'MiriamLimber/Fake-News-Bert-Detection',
    ]
    print("=== Fake News Models ===")
    for m in fake_models:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f'{HF_BASE}/{m}', json={'inputs': 'Scientists cure cancer with water'}, headers=headers)
            print(f'{m}: {r.status_code} -> {str(r.text)[:80]}')

asyncio.run(test())
