const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let db = null;
let dbPath = null;

/**
 * Initialize the SQLite database using sql.js (pure JS, no native compilation).
 * Creates the data directory and articles table if they don't exist.
 */
async function init(filePath) {
  dbPath = filePath;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing database file if it exists, otherwise create new
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      hash TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      category TEXT NOT NULL,
      posted_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_posted_at ON articles(posted_at)
  `);

  // Save to disk after init
  _save();

  console.log('📦 Database initialized');
}

/**
 * Save the in-memory database to disk.
 * sql.js operates in-memory, so we periodically flush to file.
 */
function _save() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Generate a hash for an article based on source + title.
 * This ensures we don't post the same article twice.
 */
function hashArticle(source, title) {
  const normalized = `${source}::${title}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Check if an article has already been posted.
 */
function isNew(hash) {
  const result = db.exec('SELECT 1 FROM articles WHERE hash = ?', [hash]);
  return result.length === 0 || result[0].values.length === 0;
}

/**
 * Mark an article as seen/posted.
 */
function markSeen(hash, title, source, category) {
  db.run(
    'INSERT OR IGNORE INTO articles (hash, title, source, category, posted_at) VALUES (?, ?, ?, ?, ?)',
    [hash, title, source, category, Date.now()]
  );
  _save();
}

/**
 * Remove articles older than the specified number of days.
 * Keeps the DB from growing forever.
 */
function cleanup(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const before = count();
  db.run('DELETE FROM articles WHERE posted_at < ?', [cutoff]);
  const after = count();
  const removed = before - after;
  if (removed > 0) {
    console.log(`🧹 Cleaned up ${removed} old articles`);
    _save();
  }
}

/**
 * Get the total number of stored articles (for debugging).
 */
function count() {
  const result = db.exec('SELECT COUNT(*) as c FROM articles');
  if (result.length === 0) return 0;
  return result[0].values[0][0];
}

/**
 * Close the database connection gracefully.
 */
function close() {
  if (db) {
    _save();
    db.close();
    console.log('📦 Database closed');
  }
}

module.exports = { init, hashArticle, isNew, markSeen, cleanup, count, close };
