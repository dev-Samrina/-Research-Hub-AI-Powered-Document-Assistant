# backend/app/services/web_search.py
from duckduckgo_search import DDGS
from typing import Optional


def search_web(query: str, max_results: int = 3) -> Optional[str]:
    """Search the internet for relevant information using DuckDuckGo"""
    try:
        print(f"🔍 Searching web for: '{query}'")

        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))

            if not results:
                print("⚠️ No web results found")
                return None

            # Combine results into clean context
            context_parts = []
            for i, result in enumerate(results, 1):
                title = result.get("title", "No title")
                body = result.get("body", "No content")
                href = result.get("href", "")

                context_parts.append(
                    f"[Internet Source {i}] {title}\nContent: {body}\nURL: {href}"
                )

            combined = "\n\n".join(context_parts)
            print(f"✅ Found {len(results)} web results")
            return combined

    except Exception as e:
        print(f"❌ Web search error: {e}")
        return None
