const { CronJob } = require('cron');
const config = require('./config');
const db = require('./db');
const { isRelevant } = require('./filter');
const { buildEmbed } = require('./embed');
const poster = require('./poster');

// Fetchers
const { fetchFinnhub } = require('./fetchers/finnhub');
const { fetchCurrents } = require('./fetchers/currents');
const { fetchRSS } = require('./fetchers/rss');

const jobs = [];

/**
 * Process articles from a fetcher:
 * 1. Check relevance (trading impact)
 * 2. Deduplicate via SQLite
 * 3. Build embed
 * 4. Enqueue for posting
 */
async function processArticles(fetcherName, articles) {
  let newCount = 0;
  let filteredCount = 0;

  for (const article of articles) {
    // Skip articles with empty titles
    if (!article.title || article.title.trim() === '') continue;

    // Check relevance (skip for forex factory — already pre-filtered)
    if (article.origin !== 'forexfactory') {
      const relevance = isRelevant(article.title, article.summary);
      if (!relevance.relevant) {
        filteredCount++;
        continue;
      }
      // Use the detected category if the source didn't provide a specific one
      if (relevance.category && article.category === 'general') {
        article.category = relevance.category;
      }
    }

    // Deduplicate
    const hash = db.hashArticle(article.origin, article.title);
    if (!db.isNew(hash)) continue;

    // Mark as seen
    db.markSeen(hash, article.title, article.source, article.category);

    // Build and enqueue
    const embed = buildEmbed(article);
    poster.enqueue(embed);
    newCount++;
  }

  if (newCount > 0 || filteredCount > 0) {
    console.log(
      `[${fetcherName}] ${articles.length} fetched → ${filteredCount} filtered → ${newCount} new → queue: ${poster.queueLength()}`
    );
  }
}

/**
 * Start all cron-based fetcher jobs.
 */
function startScheduler() {
  // Finnhub — every 60 seconds
  const finnhubJob = new CronJob(config.intervals.finnhub, async () => {
    try {
      const articles = await fetchFinnhub();
      await processArticles('Finnhub', articles);
    } catch (err) {
      console.error(`[Scheduler] Finnhub job error:`, err);
    }
  }, null, true);
  jobs.push(finnhubJob);

  // RSS (CoinTelegraph) — every 2 minutes
  const rssJob = new CronJob(config.intervals.rss, async () => {
    try {
      const articles = await fetchRSS();
      await processArticles('RSS', articles);
    } catch (err) {
      console.error(`[Scheduler] RSS job error: ${err.message}`);
    }
  }, null, true);
  jobs.push(rssJob);

  // Currents API — every 10 minutes
  const currentsJob = new CronJob(config.intervals.currents, async () => {
    try {
      const articles = await fetchCurrents();
      await processArticles('Currents', articles);
    } catch (err) {
      console.error(`[Scheduler] Currents job error: ${err.message}`);
    }
  }, null, true);
  jobs.push(currentsJob);


  // Database cleanup — once per day at midnight
  const cleanupJob = new CronJob('0 0 * * *', () => {
    try {
      db.cleanup(config.cleanupDays);
    } catch (err) {
      console.error(`[Scheduler] Cleanup error: ${err.message}`);
    }
  }, null, true);
  jobs.push(cleanupJob);

  console.log('⏰ Scheduler started:');
  console.log(`   • Finnhub:       ${config.intervals.finnhub}`);
  console.log(`   • RSS:           ${config.intervals.rss}`);
  console.log(`   • Currents API:  ${config.intervals.currents}`);
  console.log(`   • DB Cleanup:    0 0 * * * (daily)`);

  // Run an initial fetch immediately on startup
  console.log('🚀 Running initial fetch...');
  setTimeout(async () => {
    try {
      const results = await Promise.allSettled([
        fetchFinnhub(),
        fetchRSS(),
        fetchCurrents(),
      ]);

      const names = ['Finnhub', 'RSS', 'Currents'];
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          await processArticles(names[i], results[i].value);
        } else {
          console.error(`[Scheduler] ${names[i]} initial fetch failed: ${results[i].reason?.message || results[i].reason}`);
        }
      }

      console.log(`✅ Initial fetch complete — ${db.count()} articles in DB`);
    } catch (err) {
      console.error(`[Scheduler] Initial fetch error:`, err);
    }
  }, 2000); // 2 second delay to let Discord connection stabilize
}

/**
 * Stop all cron jobs.
 */
function stopScheduler() {
  for (const job of jobs) {
    job.stop();
  }
  console.log('⏰ Scheduler stopped');
}

module.exports = { startScheduler, stopScheduler };
