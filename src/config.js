require('dotenv').config();

const config = {
  // Discord
  discordToken: process.env.DISCORD_TOKEN,
  channelIds: (process.env.DISCORD_CHANNEL_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean),

  // API Keys
  finnhubKey: process.env.FINNHUB_API_KEY,
  currentsKey: process.env.CURRENTS_API_KEY,
  worldmonitorKey: process.env.WORLDMONITOR_API_KEY || null,

  // Polling intervals (cron expressions)
  intervals: {
    finnhub: '*/1 * * * *',       // Every 60 seconds
    rss: '*/2 * * * *',           // Every 2 minutes
    currents: '*/10 * * * *',     // Every 10 minutes
    forexFactory: '*/30 * * * *', // Every 30 minutes
  },

  // Post queue
  maxPostsPerMinute: 3,

  // Database
  dbPath: './data/news.db',
  cleanupDays: 7,

  // Relevance keywords — articles must match at least one to be posted
  relevanceKeywords: {
    forex: [
      'usd', 'eur', 'gbp', 'jpy', 'aud', 'cad', 'chf', 'nzd',
      'interest rate', 'central bank', 'federal reserve', 'fed ',
      'ecb', 'boj', 'boe', 'rba', 'rbnz', 'snb',
      'cpi', 'ppi', 'nfp', 'non-farm', 'employment',
      'forex', 'currency', 'exchange rate', 'dollar',
      'euro', 'pound', 'yen', 'rate decision', 'rate hike',
      'rate cut', 'monetary policy', 'dovish', 'hawkish',
    ],
    stocks: [
      'earnings', 'revenue', 's&p', 'nasdaq', 'dow jones',
      'nyse', 'ipo', 'merger', 'acquisition', 'buyback',
      'sec', 'stock market', 'wall street', 'market crash',
      'bull market', 'bear market', 'rally', 'sell-off',
      'selloff', 'quarterly', 'guidance', 'profit', 'loss',
      'dividend', 'index', 'equities',
    ],
    crypto: [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto',
      'blockchain', 'defi', 'stablecoin', 'binance', 'coinbase',
      'halving', 'mining', 'altcoin', 'token', 'nft',
      'web3', 'solana', 'sol', 'xrp', 'ripple',
      'exchange', 'wallet', 'etf',
    ],
    macro: [
      'gdp', 'inflation', 'recession', 'tariff', 'sanctions',
      'trade war', 'debt ceiling', 'fomc', 'rate hike', 'rate cut',
      'geopolitical', 'stimulus', 'quantitative', 'fiscal',
      'treasury', 'bond', 'yield', 'deficit', 'surplus',
      'unemployment', 'jobs report', 'consumer confidence',
      'manufacturing', 'pmi', 'retail sales',
      'oil price', 'opec', 'energy crisis',
    ],
    futures: [
      'crude oil', 'gold', 'silver', 'wti', 'brent',
      'commodities', 'natural gas', 'wheat', 'corn',
      'soybean', 'copper', 'platinum', 'palladium',
      'futures', 'commodity',
    ],
  },
};

// Validate required config
const required = [
  ['discordToken', 'DISCORD_TOKEN'],
  ['finnhubKey', 'FINNHUB_API_KEY'],
  ['currentsKey', 'CURRENTS_API_KEY'],
];

if (config.channelIds.length === 0) {
  console.error('❌ Missing required env var: DISCORD_CHANNEL_IDS');
  console.error('   Provide at least one channel ID (comma-separated for multiple).');
  process.exit(1);
}

for (const [key, envName] of required) {
  if (!config[key]) {
    console.error(`❌ Missing required env var: ${envName}`);
    console.error(`   Copy .env.example to .env and fill in your keys.`);
    process.exit(1);
  }
}

module.exports = config;
