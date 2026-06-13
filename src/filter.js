const config = require('./config');

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Precompile regexes for efficiency and whole-word matching
const compiledKeywords = {};
for (const [category, keywords] of Object.entries(config.relevanceKeywords)) {
  compiledKeywords[category] = keywords.map(kw => {
    const cleanKw = kw.trim();
    return new RegExp(`\\b${escapeRegExp(cleanKw)}\\b`, 'i');
  });
}

/**
 * Check if an article is relevant to trading/markets.
 * Returns true if the title or summary matches at least one keyword.
 * Returns the detected category based on which keyword group matched.
 */
function isRelevant(title, summary = '') {
  const text = `${title} ${summary}`;

  // Check each category's keywords and find the best match
  let matchedCategory = null;
  let maxMatches = 0;

  for (const [category, regexes] of Object.entries(compiledKeywords)) {
    let matches = 0;
    for (const regex of regexes) {
      if (regex.test(text)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category;
    }
  }

  return {
    relevant: maxMatches > 0,
    category: matchedCategory,
    score: maxMatches,
  };
}

module.exports = { isRelevant };
