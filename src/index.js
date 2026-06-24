const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const db = require('./db');
const poster = require('./poster');
const { startScheduler, stopScheduler } = require('./scheduler');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('clientReady', async () => {
  console.log(`\n🤖 Logged in as ${client.user.tag}`);
  console.log(`   Servers: ${client.guilds.cache.size}`);

  // Initialize database
  await db.init(config.dbPath);

  // Fetch all target channels
  const channels = [];
  for (const id of config.channelIds) {
    try {
      const ch = await client.channels.fetch(id);
      if (!ch || !ch.isTextBased()) {
        console.warn(`⚠️  Channel ${id} is not a text channel — skipping.`);
        continue;
      }
      channels.push(ch);
      console.log(`📢 Posting to: #${ch.name} (${ch.guild?.name || 'DM'})`);
    } catch (err) {
      console.warn(`⚠️  Could not fetch channel ${id}: ${err.message} — skipping.`);
    }
  }

  if (channels.length === 0) {
    console.error('❌ No valid channels found. Check your DISCORD_CHANNEL_IDS.');
    process.exit(1);
  }

  // Initialize poster with all channels
  poster.init(channels);

  // Start the news fetching scheduler
  startScheduler();

  console.log(`\n✅ Bot is running! Posting to ${channels.length} channel(s)...\n`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n🛑 ${signal} received — shutting down...`);
  stopScheduler();
  poster.stop();
  db.close();
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle unhandled errors gracefully (log, don't crash)
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  // Give a moment to log, then exit
  setTimeout(() => process.exit(1), 1000);
});

// Login to Discord
client.login(config.discordToken);
