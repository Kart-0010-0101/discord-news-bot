/**
 * Fetch economic calendar events from Forex Factory.
 * Uses their weekly calendar XML/JSON export files.
 *
 * Free: no API key needed. Rate limit: 2 requests per 5 minutes.
 * We poll every 30 minutes, well within limits.
 */

/**
 * Get the Forex Factory calendar URL for the current week.
 * Format: https://nfs.faireconomy.media/ff_calendar_thisweek.json
 *
 * This is the commonly used community endpoint that mirrors
 * Forex Factory's data in JSON format.
 */
const CALENDAR_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

// Track which events we've already processed by their unique combination
const processedEvents = new Set();

/**
 * Determine impact level from the event data.
 */
function getImpactLevel(impact) {
  if (!impact) return 'low';
  const normalized = impact.toLowerCase();
  if (normalized.includes('high') || normalized === 'red') return 'high';
  if (normalized.includes('medium') || normalized === 'orange') return 'medium';
  return 'low';
}

/**
 * Fetch high-impact economic events from Forex Factory.
 * Only returns HIGH and MEDIUM impact events to keep noise down.
 */
async function fetchForexFactory() {
  const articles = [];

  try {
    const res = await fetch(CALENDAR_URL, {
      headers: {
        'User-Agent': 'NewsBot/1.0',
      },
    });

    if (!res.ok) {
      console.error(`[ForexFactory] HTTP ${res.status}`);
      return articles;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error(`[ForexFactory] Unexpected response format`);
      return articles;
    }

    for (const event of data) {
      const impact = getImpactLevel(event.impact);

      // Only post high and medium impact events
      if (impact === 'low') continue;

      // Create a unique key for this event
      const eventKey = `${event.date}::${event.title}`;

      // Skip if we've already processed this event
      if (processedEvents.has(eventKey)) continue;
      processedEvents.add(eventKey);

      // Determine if the event has actual data (has been released)
      const hasData = event.actual && event.actual !== '';

      // Build a summary showing the numbers
      let summary = '';
      if (hasData) {
        const parts = [];
        if (event.actual) parts.push(`Actual: ${event.actual}`);
        if (event.forecast) parts.push(`Forecast: ${event.forecast}`);
        if (event.previous) parts.push(`Previous: ${event.previous}`);
        summary = parts.join(' | ');
      } else if (event.forecast) {
        summary = `Forecast: ${event.forecast} | Previous: ${event.previous || 'N/A'}`;
      } else {
        summary = `Previous: ${event.previous || 'N/A'}`;
      }

      // Add impact and country context
      const impactEmoji = impact === 'high' ? '🔴' : '🟡';
      summary = `${impactEmoji} ${impact.toUpperCase()} IMPACT | ${event.country || ''}\n${summary}`;

      articles.push({
        title: `📅 ${event.title || 'Economic Event'}`,
        summary: summary,
        url: 'https://www.forexfactory.com/calendar',
        source: 'Forex Factory',
        category: 'forex',
        timestamp: event.date ? new Date(event.date).getTime() : Date.now(),
        imageUrl: null,
        origin: 'forexfactory',
      });
    }

    // Cleanup old processed events (keep last 500)
    if (processedEvents.size > 500) {
      const entries = [...processedEvents];
      processedEvents.clear();
      entries.slice(-200).forEach(e => processedEvents.add(e));
    }
  } catch (err) {
    console.error(`[ForexFactory] Fetch error: ${err.message}`);
  }

  return articles;
}

module.exports = { fetchForexFactory };
