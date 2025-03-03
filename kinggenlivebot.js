require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Log environment variables to check if they are being loaded correctly
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN);
console.log('TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID);
console.log('TWITCH_CLIENT_SECRET:', process.env.TWITCH_CLIENT_SECRET);
console.log('DISCORD_CHANNEL_ID:', process.env.DISCORD_CHANNEL_ID);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Twitch API Access Token
let twitchAccessToken = '';
let notifiedAlready = false; // Track if we've already sent the notification

// Function to get a new Twitch access token
async function getTwitchAccessToken() {
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
  });
  twitchAccessToken = response.data.access_token;
}

// Function to check if the Twitch stream is live
async function checkIfLive() {
  if (!twitchAccessToken) {
    await getTwitchAccessToken();
  }

  const response = await axios.get(`https://api.twitch.tv/helix/streams?user_login=kinggenallahdon`, {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${twitchAccessToken}`,
    },
  });

  if (response.data.data && response.data.data.length > 0) {
    return true; // The stream is live
  }
  return false; // The stream is not live
}

// Send message to Discord
async function sendDiscordNotification() {
  try {
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    await channel.send('@everyone I am now live on Twitch! Come join the stream! https://twitch.tv/kinggenallahdon');
    notifiedAlready = true; // Set the flag to true after sending the notification
  } catch (error) {
    console.error('Error sending notification to Discord:', error);
  }
}

// Monitor the Twitch stream status at regular intervals
async function monitorStream() {
  const isLive = await checkIfLive();
  if (isLive && !notifiedAlready) {
    await sendDiscordNotification(); // Send notification if the stream is live
  } else if (!isLive) {
    notifiedAlready = false; // Reset notification flag if stream is not live
  }
}

// Log in to Discord bot
client.login(DISCORD_TOKEN).then(() => {
  console.log('Bot is logged in!');
  // Check every 1 minute (60000ms)
  setInterval(monitorStream, 60000); // Check if live every minute
});