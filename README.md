# 🤖 Market & Crypto News Discord Bot

A lightweight, robust, and self-contained Discord bot that aggregates, filters, and posts real-time financial, crypto, and macroeconomic news to your Discord server.

---

## 🌟 Key Features

* **Multi-Source News Aggregation**:
  * **Finnhub API**: For real-time market news and crypto headlines (polled every 60s).
  * **CoinTelegraph RSS**: Direct feed for blockchain and crypto news (polled every 2m).
  * **Currents API**: For global business, macroeconomics, and market-moving events (polled every 10m).
* **Smart Relevance Filtering**:
  * Uses regex-based whole-word boundary matching (`\b`) to ensure news matches specific trading categories while avoiding false positives (e.g., matching `"defi"` for Decentralized Finance but correctly ignoring the word `"deficiency"`).
* **Rate Limiting & Throttling**:
  * Features a queue-based poster that limits posts to 3 embeds per minute (configurable) to prevent triggering Discord API rate limits during high-volatility news surges.
* **SQLite Deduplication**:
  * Built on `sql.js` (fully Javascript-based SQLite) for zero-dependency local database file storage.
  * Hashes titles/sources to guarantee articles are never posted twice, with automated daily database cleanups to keep the footprint small.
* **Rich Embed Layouts**:
  * Formats articles into beautiful Discord Embeds with category-specific colors, source attribution, and summaries truncated cleanly to fit Discord's limits.
* **Resilience**:
  * Handles errors gracefully (failed individual source fetches won't crash the bot) and implements graceful shutdown handling (`SIGINT`, `SIGTERM`) to clean up database file descriptors and active cron tasks.

---

## 📁 Project Structure

```text
├── src/
│   ├── fetchers/
│   │   ├── currents.js      # Currents API fetcher
│   │   ├── finnhub.js       # Finnhub API fetcher
│   │   └── rss.js           # CoinTelegraph RSS feed parser
│   ├── config.js            # Environment validation and relevance keywords
│   ├── db.js                # sql.js wrapper for hashing & deduplication
│   ├── embed.js             # Discord EmbedBuilder formatting
│   ├── filter.js            # Keyword boundary relevance checking
│   ├── index.js             # Entry point / Discord client setup
│   ├── poster.js            # Queue & rate-limiting engine
│   └── scheduler.js         # Cron job definitions & startup fetch
├── .env.example             # Template for API keys and tokens
├── .gitignore               # Ensures node_modules, .env, and local DBs are not committed
├── package.json             # NPM project definitions
└── README.md                # Documentation
```

---

## ⚙️ Configuration & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* A Discord Bot Token and Channel ID

### 1. Installation
Clone or copy the project files to your server and install the dependencies:
```bash
npm install
```

### 2. Environment Setup
Copy the `.env.example` file to create your own `.env` configuration:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:
```ini
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_discord_channel_id

# News API Credentials
FINNHUB_API_KEY=your_finnhub_api_key
CURRENTS_API_KEY=your_currents_api_key
```

### 3. Relevance Keywords
The bot is pre-configured to watch for keywords in the following categories (defined in `src/config.js`):
* **Forex**: e.g., currency codes, central banks (Fed, ECB), inflation metrics (CPI, NFP), monetary policies.
* **Stocks**: e.g., earnings reports, mergers, NYSE/Nasdaq listings, SEC filings, dividends, Wall Street events.
* **Crypto**: e.g., blockchain, bitcoin (BTC), ethereum (ETH), altcoins, DeFI, ETFs, mining.
* **Macro**: e.g., GDP, trade wars, recession, bond yields, retail sales, oil price/OPEC.
* **Futures**: e.g., crude oil, gold, silver, copper, wheat, commodities.

---

## 🚀 Running the Bot

### Development / Local Run
To start the bot manually:
```bash
npm start
```

### Production Deployment
Since the bot is lightweight and writes to a single local SQLite database file, it can easily be hosted on:
* **Server managers** (like Wispbyte / Pterodactyl): Simply install dependencies and run `npm start` (with node `/src/index.js` as the startup command).
* **PM2**:
  ```bash
  pm2 start src/index.js --name "news-bot"
  ```
