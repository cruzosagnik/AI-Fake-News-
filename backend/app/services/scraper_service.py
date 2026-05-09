import httpx
from typing import Optional


async def scrape_url(url: str) -> str:
    """
    Scrape article text from a URL using newspaper3k (sync) wrapped in asyncio,
    with a fallback to raw HTTP + basic text extraction.
    """
    try:
        from newspaper import Article
        import asyncio

        loop = asyncio.get_event_loop()

        def _download():
            from newspaper import Config
            config = Config()
            config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            config.request_timeout = 15
            
            article = Article(url, config=config)
            article.download()
            article.parse()
            return article.text

        text = await loop.run_in_executor(None, _download)
        if text and len(text) > 100:
            return text
    except Exception as e:
        print(f"newspaper3k failed: {e}")

    # Fallback: raw HTTP fetch
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")
            # Remove scripts and styles
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            paragraphs = soup.find_all("p")
            return " ".join(p.get_text(strip=True) for p in paragraphs)
    except Exception as e:
        raise ValueError(f"Failed to scrape URL: {e}")
