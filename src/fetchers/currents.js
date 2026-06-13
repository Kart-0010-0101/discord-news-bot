const config = require('../config');

/**
 * Fetch real-time news from Currents API.
 * Covers politics, economics, business — macro events that move markets.
 *
 * Endpoint: GET https://api.currentsapi.services/v1/latest-news
 * Free tier: 1,000 calls/day (resets daily), no credit card.
 */
async function fetchCurrents() {
  const articles = [];

  try {
    const params = new URLSearchParams({
      apiKey: config.currentsKey,
      language: 'en',
      category: 'business',
    });

    const url = `https://api.currentsapi.services/v1/latest-news?${params}`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[Currents] HTTP ${res.status}`);
      return articles;
    }

    const data = await res.json();

    if (!data.news || !Array.isArray(data.news)) {
      console.error(`[Currents] Unexpected response format`);
      return articles;
    }

    // Take the 10 most recent
    const recent = data.news.slice(0, 10);

    for (const item of recent) {
      articles.push({
        title: item.title || '',
        summary: item.description || '',
        url: item.url || '',
        source: item.author || 'Currents',
        category: 'macro',
        timestamp: item.published ? new Date(item.published).getTime() : Date.now(),
        imageUrl: (item.image && item.image !== 'None') ? item.image : null,
        origin: 'currents',
      });
    }
  } catch (err) {
    console.error(`[Currents] Fetch error: ${err.message}`);
  }

  return articles;
}

module.exports = { fetchCurrents };
