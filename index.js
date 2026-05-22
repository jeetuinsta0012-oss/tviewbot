const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
} = require("discord.js");

require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const API_KEY = process.env.SMM_API_KEY;

const ALLOWED_CHANNEL_ID = "1453664649521401907";

const client = new Client({
  intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  ],
});

// Slash command setup
const commands = [
  new SlashCommandBuilder()
    .setName("tviews")
    .setDescription("Place TikTok views order")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription("Enter TikTok video link")
        .setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

// Register slash commands
(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log("Slash commands registered.");
  } catch (err) {
    console.error(err);
  }
})();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "tviews") {
    // Restrict command to specific channel
    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
      return interaction.reply({
        content:
          "❌ You can only use this command in the allowed channel.",
        ephemeral: true,
      });
    }

    const link = interaction.options.getString("link");

    // Basic TikTok URL validation
    if (
      !link.includes("tiktok.com") ||
      (!link.startsWith("https://") &&
        !link.startsWith("http://"))
    ) {
      return interaction.reply({
        content: "❌ Please provide a valid TikTok video link.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Place order API request
      const response = await fetch(
        "https://cheapestsmmpanels.com/api/v2",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            key: API_KEY,
            action: "add",
            service: "3066",
            link: link,
            quantity: "100",
          }),
        }
      );

      const data = await response.json();

      // SUCCESS
      if (data.order) {
        // Reply to user
        await interaction.editReply({
          content: `✅ Order placed successfully!

🆔 Order ID: ${data.order}

⚠️ Instruction:
Do not place the same order for the same video before this order gets completed.`,
        });

        // Send public message in channel
        await interaction.channel.send({
          content: `📢 New TikTok Views Order

👤 User: <@${interaction.user.id}>
🔗 Link: <${link}>
📦 Amount: 100`,
        });
      } else {
        // API returned error
        return interaction.editReply({
          content: `❌ Failed to place order.

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``,
        });
      }
    } catch (error) {
      console.error(error);

      return interaction.editReply({
        content:
          "❌ An error occurred while placing the order.",
      });
    }
  }
});

require("./commands/orderapprove")(client);
client.login(TOKEN);
