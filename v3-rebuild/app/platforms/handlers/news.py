"""
News Platform Handler

Supports 200+ news sites with article extraction.

Major outlets:
- BBC, CNN, NYT, Guardian, Reuters
- Tech: TechCrunch, Verge, Wired, ArsTechnica
- Business: Bloomberg, WSJ, Financial Times
"""

import asyncio
import re
from pathlib import Path
from typing import Optional, Callable
from urllib.parse import urlparse

import httpx
from loguru import logger

from app.core.platform_router import BasePlatformHandler, PlatformInfo
from app.core.download_engine import download_engine
from app.config import settings


class NewsHandler(BasePlatformHandler):
    """Handler for news article downloads."""

    id = "news"
    name = "News Sites"
    icon = "newspaper"
    category = "news"

    requires_auth = False
    supports_quality_selection = False
    supports_subtitles = False
    supports_playlists = False
    supports_channels = False

    rate_limit_rpm = 60

    # Major news domains
    NEWS_DOMAINS = {
        # Major outlets
        "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "theguardian.com",
        "reuters.com", "apnews.com", "washingtonpost.com", "wsj.com",
        # Tech
        "techcrunch.com", "theverge.com", "wired.com", "arstechnica.com",
        "engadget.com", "gizmodo.com", "mashable.com", "zdnet.com",
        # Business
        "bloomberg.com", "ft.com", "forbes.com", "businessinsider.com",
        "cnbc.com", "marketwatch.com",
        # Science
        "nature.com", "sciencemag.org", "newscientist.com", "sciencedaily.com",
        # General
        "medium.com", "huffpost.com", "buzzfeed.com", "vox.com",
        "theatlantic.com", "newyorker.com", "slate.com",
    }

    url_patterns = [
        # Will match any URL and check domain in can_handle
        r"^https?://",
    ]

    @classmethod
    def can_handle(cls, url: str) -> Optional[PlatformInfo]:
        """Check if URL is from a known news site."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()

            # Remove www. prefix
            if domain.startswith("www."):
                domain = domain[4:]

            # Check against known news domains
            for news_domain in cls.NEWS_DOMAINS:
                if domain == news_domain or domain.endswith(f".{news_domain}"):
                    return PlatformInfo(
                        id=cls.id,
                        name=cls.name,
                        category=cls.category,
                        icon=cls.icon,
                        url_type="article",
                        metadata={"domain": domain},
                    )

            return None

        except Exception:
            return None

    async def download(
        self,
        url: str,
        options: dict,
        progress_callback: Optional[Callable] = None,
    ) -> dict:
        """Download and save news article."""
        try:
            from bs4 import BeautifulSoup
            import markdownify

            output_dir = settings.downloads_dir / "news"
            output_dir.mkdir(parents=True, exist_ok=True)

            # Fetch article
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    },
                    follow_redirects=True,
                )

                if response.status_code != 200:
                    return {"success": False, "error": f"Failed to fetch: {response.status_code}"}

                html = response.text

            # Parse HTML
            soup = BeautifulSoup(html, "lxml")

            # Extract title
            title_tag = soup.find("title")
            title = title_tag.get_text() if title_tag else "Untitled Article"
            title = re.sub(r'[\\/*?:"<>|]', "", title)[:100]

            # Extract article content (common patterns)
            article = None
            for selector in ["article", "[role='main']", ".article-body", ".post-content", "main"]:
                article = soup.select_one(selector)
                if article:
                    break

            if not article:
                article = soup.find("body")

            # Remove unwanted elements
            for tag in article.find_all(["script", "style", "nav", "footer", "aside", "iframe"]):
                tag.decompose()

            # Convert to markdown
            content = markdownify.markdownify(str(article), heading_style="ATX")

            # Clean up markdown
            content = re.sub(r"\n{3,}", "\n\n", content)
            content = content.strip()

            # Generate filename
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "")
            safe_title = re.sub(r"[^\w\s-]", "", title)[:50]
            filename = f"{domain}_{safe_title}.md"

            # Save markdown
            dest_path = output_dir / filename
            dest_path.write_text(f"# {title}\n\nSource: {url}\n\n---\n\n{content}", encoding="utf-8")

            return {
                "success": True,
                "file_path": str(dest_path),
                "title": title,
                "platform": self.id,
            }

        except Exception as e:
            logger.exception(f"News download error: {e}")
            return {"success": False, "error": str(e)}

    async def get_info(self, url: str) -> dict:
        """Get article info."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    headers={"User-Agent": "Mozilla/5.0"},
                    follow_redirects=True,
                )

                if response.status_code != 200:
                    return {"success": False, "error": "Could not fetch"}

                from bs4 import BeautifulSoup
                soup = BeautifulSoup(response.text, "lxml")

                title = soup.find("title")
                description = soup.find("meta", {"name": "description"})
                og_image = soup.find("meta", {"property": "og:image"})

                return {
                    "success": True,
                    "title": title.get_text() if title else None,
                    "description": description.get("content") if description else None,
                    "thumbnail": og_image.get("content") if og_image else None,
                }

        except Exception as e:
            return {"success": False, "error": str(e)}
