const RssParser = require('rss-parser');

const parser = new RssParser({
  timeout: 15000,
  headers: {
    'User-Agent': 'NewsBot/1.0',
  },
});

/**
 * RSS feed sources.
 * CoinTelegraph: confirmed working, real-time, free, no API key.
 */
const RSS_FEEDS = [
  {
    name: 'CoinTelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'crypto',
  },
];

/**
 * Fetch articles from all RSS feeds.
 * Completely free — no API keys, no rate limits.
 */
async function fetchRSS() {
  const articles = [];

  for (const feed of RSS_FEEDS) {
    try {
      const data = await parser.parseURL(feed.url);

      if (!data.items || !Array.isArray(data.items)) {
        console.error(`[RSS] No items from ${feed.name}`);
        continue;
      }

      // Take the 10 most recent items
      const recent = data.items.slice(0, 10);

      for (const item of recent) {
        // Extract image from various possible fields
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
          imageUrl = item['media:content']['$'].url;
        }

        // Clean up description — strip HTML tags
        let summary = item.contentSnippet || item.content || '';
        summary = summary.replace(/<[^>]*>/g, '').trim();

        articles.push({
          title: item.title || '',
          summary: summary,
          url: item.link || '',
          source: feed.name,
          category: feed.category,
          timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          imageUrl: imageUrl,
          origin: 'rss',
        });
      }
    } catch (err) {
      console.error(`[RSS] Fetch error (${feed.name}): ${err.message}`);
    }
  }

  return articles;
}

module.exports = { fetchRSS };
