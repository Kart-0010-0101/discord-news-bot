const config = require('../config');

/**
 * Fetch market news from Finnhub.
 * Makes 2 calls: one for general market news, one for crypto.
 *
 * Endpoint: GET https://finnhub.io/api/v1/news?category={category}&token={key}
 * Free tier: 60 calls/min (rolling), no daily cap.
 */
async function fetchFinnhub() {
  const articles = [];

  for (const category of ['general', 'crypto']) {
    try {
      const url = `https://finnhub.io/api/v1/news?category=${category}&token=${config.finnhubKey}`;
      const res = await fetch(url);

      if (!res.ok) {
        console.error(`[Finnhub] HTTP ${res.status} for category=${category}`);
        continue;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error(`[Finnhub] Unexpected response for category=${category}`);
        continue;
      }

      // Only take the 10 most recent articles per category
      const recent = data.slice(0, 10);

      for (const item of recent) {
        articles.push({
          title: item.headline || '',
          summary: item.summary || '',
          url: item.url || '',
          source: item.source || 'Finnhub',
          category: category === 'crypto' ? 'crypto' : 'stocks',
          timestamp: item.datetime ? item.datetime * 1000 : Date.now(),
          imageUrl: item.image || null,
          origin: 'finnhub',
        });
      }
    } catch (err) {
      console.error(`[Finnhub] Fetch error (${category}): ${err.message}`);
    }
  }

  return articles;
}

module.exports = { fetchFinnhub };
