const { EmbedBuilder } = require('discord.js');

/**
 * Category color map for visual distinction in Discord.
 */
const CATEGORY_COLORS = {
  crypto:  0x00C853,  // Green
  stocks:  0x2979FF,  // Blue
  forex:   0xFFD600,  // Yellow
  macro:   0xFF1744,  // Red
  futures: 0xFF6D00,  // Orange
  general: 0x90A4AE,  // Grey
};

/**
 * Category emoji map.
 */
const CATEGORY_EMOJI = {
  crypto:  '🟢',
  stocks:  '🔵',
  forex:   '🟡',
  macro:   '🔴',
  futures: '🟠',
  general: '⚪',
};

/**
 * Category label for display.
 */
const CATEGORY_LABEL = {
  crypto:  'CRYPTO',
  stocks:  'STOCKS',
  forex:   'FOREX',
  macro:   'MACRO',
  futures: 'FUTURES',
  general: 'NEWS',
};

/**
 * Build a Discord embed from a normalized article object.
 *
 * @param {Object} article - Normalized article
 * @param {string} article.title - Article headline
 * @param {string} article.summary - Short description
 * @param {string} article.url - Link to full article
 * @param {string} article.source - Source name (e.g. "Finnhub", "CoinTelegraph")
 * @param {string} article.category - Category key (crypto, stocks, forex, macro, futures)
 * @param {number} article.timestamp - Unix timestamp (ms)
 * @param {string} [article.imageUrl] - Optional thumbnail URL
 * @returns {EmbedBuilder}
 */
function buildEmbed(article) {
  const cat = article.category || 'general';
  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.general;
  const emoji = CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.general;
  const label = CATEGORY_LABEL[cat] || CATEGORY_LABEL.general;

  // Truncate summary to 300 characters
  const description = (article.summary || '').trim();

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(article.title.slice(0, 256))
    .setURL(article.url);

  if (description.length > 0) {
    embed.setDescription(description.length > 300 ? description.slice(0, 297) + '...' : description);
  }
  embed.addFields({
      name: 'Category',
      value: `${emoji} ${label}`,
      inline: true,
    }, {
      name: 'Source',
      value: article.source,
      inline: true,
    })
    .setTimestamp(article.timestamp ? new Date(article.timestamp) : new Date())
    .setFooter({ text: `📰 Market News Bot` });

  // Add thumbnail if available
  if (article.imageUrl) {
    try {
      embed.setThumbnail(article.imageUrl);
    } catch {
      // Skip invalid image URLs silently
    }
  }

  return embed;
}

module.exports = { buildEmbed };
