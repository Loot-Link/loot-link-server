import { Client, GatewayIntentBits } from "discord.js";
import db from "#db/client";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// Log in using your token from the .env file
if (process.env.DISCORD_BOT_TOKEN) {
  client.login(process.env.DISCORD_BOT_TOKEN);
}

client.once("ready", async () => {
  console.log(`🤖 Discord Bot logged in as ${client.user.tag}`);
  await wipeAllLFGExtraChannels(client); // Clean up any orphaned channels on startup
});

/**
 * Automatically creates a temporary voice channel and returns an invite link
 */
export async function createTemporaryVoiceChannel(lobbyName) {
  try {
    const guildId = process.env.DISCORD_GUILD_ID; // Your specific server ID
    const guild = await client.guilds.fetch(guildId);
    
    // 1. Create the Voice Channel inside your server
    const channel = await guild.channels.create({
      name: `🔊 LFG: ${lobbyName}`,
      type: 2 // 2 stands for GuildVoice channel type
    });

    // 2. Generate an instant invite link to that specific room
    const invite = await channel.createInvite({
      maxAge: 86400, // 24 hours
      maxUses: 0      
    });

    return {
      voice_url: invite.url,
      discord_channel_id: channel.id
    };
  } catch (err) {
    console.error("Discord Bot Failed to create channel:", err);
    return null;
  }
}
export async function deleteTemporaryVoiceChannel(channelId) {
  try {
    const client = await getDiscordBotClient(); // Grabs your active bot instance
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.delete();
      console.log(`🧹 Discord voice channel ${channelId} cleaned up successfully.`);
    }
  } catch (err) {
    console.error("Failed to delete Discord channel:", err.message);
  }
}
export async function wipeAllLFGExtraChannels(client) {
  try {
    // 1. Fetch all active session titles currently running in your database
    const dbCheckSql = `SELECT session_title FROM sessions WHERE session_status = 'active';`;
    const { rows: activeLobbies } = await db.query(dbCheckSql);
    
    // Create a clean list of active titles and format them how they appear on Discord (e.g., "LFG: Lobby Name")
    const activeChannelNames = activeLobbies.map(lobby => `LFG: ${lobby.session_title}`.toLowerCase());

    // 2. Fetch your target Discord server
    const guildId = process.env.DISCORD_GUILD_ID || client.guilds.cache.first()?.id;
    if (!guildId) return;

    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    console.log("🧹 Discord Cleaner: Scanning for orphaned voice channels...");
    
    let count = 0;
    for (const [id, channel] of channels) {
      // Rule 1: Must be a voice channel (type 2)
      // Rule 2: Must start with "LFG:"
      // Rule 3: The name must NOT be inside our active database list!
      if (channel.type === 2 && channel.name.startsWith("LFG:")) {
        const lowerChannelName = channel.name.toLowerCase();
        
        if (!activeChannelNames.includes(lowerChannelName)) {
          await channel.delete();
          count++;
        }
      }
    }
    
    if (count > 0) {
      console.log(`✅ Discord Cleaner: Successfully wiped ${count} dead voice channels!`);
    } else {
      console.log("✨ Discord Cleaner: Active voice rooms protected. Server is clean.");
    }
  } catch (err) {
    console.error("❌ Discord Cleaner failed to filter rooms:", err.message);
  }
}