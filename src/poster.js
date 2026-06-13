const config = require('./config');

/**
 * Rate-limited post queue.
 * Max 3 posts per minute — overflow is queued for the next minute slot.
 * Errors are logged to console only, never posted to Discord.
 */

const queue = [];
let channel = null;
let postsThisMinute = 0;
let drainInterval = null;
let minuteResetInterval = null;

/**
 * Initialize the poster with a Discord channel.
 */
function init(discordChannel) {
  channel = discordChannel;

  // Drain the queue: try to send one post every 20 seconds (= 3 per minute max)
  drainInterval = setInterval(() => {
    if (queue.length === 0) return;
    if (postsThisMinute >= config.maxPostsPerMinute) return;

    const embed = queue.shift();
    sendToChannel(embed);
  }, 20_000);

  // Reset the per-minute counter every 60 seconds
  minuteResetInterval = setInterval(() => {
    postsThisMinute = 0;
  }, 60_000);

  console.log(`📮 Poster initialized (max ${config.maxPostsPerMinute}/min)`);
}

/**
 * Enqueue an embed for posting.
 */
function enqueue(embed) {
  queue.push(embed);

  // If under the limit, try to send immediately
  if (postsThisMinute < config.maxPostsPerMinute) {
    const item = queue.shift();
    if (item) sendToChannel(item);
  }
}

/**
 * Send an embed to the Discord channel.
 * All errors are logged to console only.
 */
async function sendToChannel(embed) {
  if (!channel) {
    console.error('[Poster] Channel not initialized');
    return;
  }

  try {
    await channel.send({ embeds: [embed] });
    postsThisMinute++;
  } catch (err) {
    console.error(`[Poster] Failed to send message: ${err.message}`);
    // Do NOT re-queue on failure to avoid infinite loops
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
