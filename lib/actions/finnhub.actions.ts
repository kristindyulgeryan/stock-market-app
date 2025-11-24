"use server";

import {
  getDateRange,
  validateArticle,
  formatArticle,
  calculateNewsDistribution,
} from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

interface FetchOptions {
  revalidateSeconds?: number;
}

/**
 * Fetch JSON from URL with optional caching strategy
 * @param url - The URL to fetch
 * @param revalidateSeconds - Optional revalidation time for caching (force-cache if provided)
 */
async function fetchJSON<T>(
  url: string,
  revalidateSeconds?: number
): Promise<T> {
  const cacheOption = revalidateSeconds
    ? {
        cache: "force-cache" as const,
        next: { revalidate: revalidateSeconds },
      }
    : { cache: "no-store" as const };

  const response = await fetch(url, cacheOption);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from ${url}: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Get news for given symbols or general market news
 * @param symbols - Optional array of stock symbols (will round-robin through them)
 * @returns Array of formatted articles (max 6)
 */
export const getNews = async (
  symbols?: string[]
): Promise<MarketNewsArticle[]> => {
  try {
    if (!FINNHUB_API_KEY) {
      throw new Error("NEXT_PUBLIC_FINNHUB_API_KEY is not set");
    }

    const { from, to } = getDateRange(5); // Last 5 days

    // If symbols provided, fetch company news round-robin
    if (symbols && symbols.length > 0) {
      const cleanedSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);

      const { itemsPerSymbol, targetNewsCount } = calculateNewsDistribution(
        cleanedSymbols.length
      );

      const articles: RawNewsArticle[] = [];
      const seenIds = new Set<string | number>();

      // Round-robin through symbols
      for (let round = 0; round < itemsPerSymbol; round++) {
        for (const symbol of cleanedSymbols) {
          if (articles.length >= targetNewsCount) break;

          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
            const data = await fetchJSON<RawNewsArticle[]>(url);

            // Find first valid, unseen article in this round
            const newArticle = data.find(
              (article) => validateArticle(article) && !seenIds.has(article.id)
            );

            if (newArticle) {
              articles.push(newArticle);
              seenIds.add(newArticle.id);
            }
          } catch (error) {
            console.error(`Error fetching news for ${symbol}:`, error);
            continue;
          }
        }
        if (articles.length >= targetNewsCount) break;
      }

      // Sort by datetime descending (newest first)
      articles.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));

      // Format and return
      return articles
        .slice(0, 6)
        .map((article, index) =>
          formatArticle(article, true, cleanedSymbols[0], index)
        );
    }

    // Fallback: Fetch general market news
    try {
      const url = `${FINNHUB_BASE_URL}/news?category=general&minid=0&token=${FINNHUB_API_KEY}`;
      const data = await fetchJSON<RawNewsArticle[]>(url);

      // Deduplicate by id, url, and headline
      const seenKeys = new Set<string>();
      const uniqueArticles: RawNewsArticle[] = [];

      for (const article of data) {
        if (!validateArticle(article)) continue;

        const key = `${article.id}|${article.url}|${article.headline}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueArticles.push(article);
        }
      }

      // Sort by datetime and take top 6
      uniqueArticles.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));

      return uniqueArticles
        .slice(0, 6)
        .map((article, index) =>
          formatArticle(article, false, undefined, index)
        );
    } catch (error) {
      console.error("Error fetching general market news:", error);
      throw new Error("Failed to fetch news");
    }
  } catch (error) {
    console.error("Error in getNews:", error);
    throw error;
  }
};
