const config = require('./config');

/**
 * Rate-limited post queue.
 * Sends each news embed to ALL configured channels.
 * Max 3 posts per minute per channel — overflow is queued for the next slot.
 * Errors are logged to console only, never posted to Discord.
 */

const queue = [];
let channels = [];
let postsThisMinute = 0;
let drainInterval = null;
let minuteResetInterval = null;

/**
 * Initialize the poster with an array of Discord channels.
 */
function init(discordChannels) {
  channels = discordChannels;

  // Drain the queue: try to send one post every 20 seconds (= 3 per minute max)
  drainInterval = setInterval(() => {
    if (queue.length === 0) return;
    if (postsThisMinute >= config.maxPostsPerMinute) return;

    const embed = queue.shift();
    broadcast(embed);
  }, 20_000);

  // Reset the per-minute counter every 60 seconds
  minuteResetInterval = setInterval(() => {
    postsThisMinute = 0;
  }, 60_000);

  console.log(`📮 Poster initialized — ${channels.length} channel(s), max ${config.maxPostsPerMinute}/min`);
}

/**
 * Enqueue an embed for posting.
 */
function enqueue(embed) {
  queue.push(embed);

  // If under the limit, try to send immediately
  if (postsThisMinute < config.maxPostsPerMinute) {
    const item = queue.shift();
    if (item) broadcast(item);
  }
}

/**
 * Broadcast an embed to all channels.
 */
async function broadcast(embed) {
  if (channels.length === 0) {
    console.error('[Poster] No channels initialized');
    return;
  }

  postsThisMinute++;

  for (const ch of channels) {
    try {
      await ch.send({ embeds: [embed] });
    } catch (err) {
      console.error(`[Poster] Failed to send to #${ch.name} (${ch.id}): ${err.message}`);
    }
  }
}

/**
 * Get current queue length (for debugging).
 */
function queueLength() {
  return queue.length;
}

/**
 * Gracefully stop the poster and drain remaining items.
 */
function stop() {
  if (drainInterval) clearInterval(drainInterval);
  if (minuteResetInterval) clearInterval(minuteResetInterval);
  console.log(`📮 Poster stopped (${queue.length} items remaining in queue)`);
}

module.exports = { init, enqueue, queueLength, stop };

