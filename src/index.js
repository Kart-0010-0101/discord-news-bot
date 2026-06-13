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

  // Fetch the target channel
  let channel;
  try {
    channel = await client.channels.fetch(config.channelId);
  } catch (err) {
    console.error(`❌ Could not fetch channel ${config.channelId}: ${err.message}`);
    console.error('   Make sure the channel ID is correct and the bot has access.');
    process.exit(1);
  }

  if (!channel || !channel.isTextBased()) {
    console.error(`❌ Channel ${config.channelId} is not a text channel.`);
    process.exit(1);
  }

  console.log(`📢 Posting to: #${channel.name}`);

  // Initialize poster with the channel
  poster.init(channel);

  // Start the news fetching scheduler
  startScheduler();

  console.log('\n✅ Bot is running! Watching for news...\n');
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
