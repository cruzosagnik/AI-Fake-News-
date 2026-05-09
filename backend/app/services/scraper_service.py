import httpx
from typing import Optional


async def scrape_url(url: str) -> str:
    """
    Scrape article text from a URL using newspaper3k (sync) wrapped in asyncio,
    with a fallback to raw HTTP + basic text extraction.
    """
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1"
    }

    try:
        from newspaper import Article
        import asyncio

        loop = asyncio.get_event_loop()

        def _download():
            from newspaper import Config
            config = Config()
            config.browser_user_agent = HEADERS["User-Agent"]
            config.headers = HEADERS
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
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=HEADERS) as client:
            resp = await client.get(url)
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
