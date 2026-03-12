import httpx
from bs4 import BeautifulSoup
from typing import Optional


async def extract_metadata(url: str) -> dict:
    """Fetch a URL and extract title, author, and publish date from meta tags."""
    result = {
        "source_title": None,
        "author_name": None,
        "published_date": None,
    }
    try:
        async with httpx.AsyncClient(
            follow_redirects=True, timeout=10.0
        ) as client:
            resp = await client.get(
                url, headers={"User-Agent": "Passages/1.0"}
            )
            resp.raise_for_status()
    except (httpx.HTTPError, httpx.InvalidURL):
        return result

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        result["source_title"] = og_title["content"]
    elif soup.title and soup.title.string:
        result["source_title"] = soup.title.string.strip()

    # Author
    for attr in [
        {"name": "author"},
        {"property": "article:author"},
        {"name": "twitter:creator"},
    ]:
        tag = soup.find("meta", attrs=attr)
        if tag and tag.get("content"):
            result["author_name"] = tag["content"]
            break

    # Publish date
    for attr in [
        {"property": "article:published_time"},
        {"name": "date"},
        {"name": "publication_date"},
    ]:
        tag = soup.find("meta", attrs=attr)
        if tag and tag.get("content"):
            raw = tag["content"][:10]  # take YYYY-MM-DD portion
            result["published_date"] = raw
            break

    return result
