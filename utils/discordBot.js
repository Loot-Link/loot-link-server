import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// Log in using your token from the .env file
if (process.env.DISCORD_BOT_TOKEN) {
  client.login(process.env.DISCORD_BOT_TOKEN);
}

client.once("ready", () => {
  console.log(`🤖 Discord Bot logged in as ${client.user.tag}`);
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
