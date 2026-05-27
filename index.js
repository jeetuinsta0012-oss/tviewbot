const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  ChannelType,
} = require("discord.js");

require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;
const API_KEY = process.env.SMM_API_KEY;

const OWNER_ID = "1487485450833756235";

// CHANNEL IDS
const LOG_CHANNEL_ID = "1502237695815188632";
const PREMIUM_CHANNEL_ID = "1502987716462252143";

// FREE SERVICE SETTINGS
const SERVICE_ID = "668";
const QUANTITY = "100";

// 1 HOUR COOLDOWN
const cooldowns = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// MESSAGE COMMANDS
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // OWNER ONLY .setup COMMAND
  if (message.content === ".setup") {
    if (message.author.id !== OWNER_ID) {
      return message.reply(
        "❌ You are not allowed to use this command."
      );
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("free_service")
        .setLabel("100 Free Views")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setLabel("Premium Services")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/channels/${message.guild.id}/${PREMIUM_CHANNEL_ID}`
        )
    );

    await message.channel.send({
      embeds: [
        {
          title: "Free Viewer",
          description:
            "Click the buttons below to get services",
          color: 0x57f287,
          footer: {
            text: "Free TikTok Views Service",
          },
        },
      ],
      components: [row],
    });
  }
});

// INTERACTIONS
client.on(Events.InteractionCreate, async (interaction) => {
  // FREE BUTTON
  if (
    interaction.isButton() &&
    interaction.customId === "free_service"
  ) {
    // COOLDOWN CHECK
    const userCooldown = cooldowns.get(
      interaction.user.id
    );

    if (userCooldown && Date.now() < userCooldown) {
      const remaining =
        Math.ceil(
          (userCooldown - Date.now()) / 60000
        );

      return interaction.reply({
        content: `❌ You already used the free service.\nTry again in ${remaining} minute(s).`,
        ephemeral: true,
      });
    }

    // MODAL
    const modal = new ModalBuilder()
      .setCustomId("free_modal")
      .setTitle("Free TikTok Views");

    const videoLink =
      new TextInputBuilder()
        .setCustomId("video_link")
        .setLabel("TikTok Video Link")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(
          "https://www.tiktok.com/..."
        );

    const amount =
      new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("Amount")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue("100");

    const row1 =
      new ActionRowBuilder().addComponents(
        videoLink
      );

    const row2 =
      new ActionRowBuilder().addComponents(
        amount
      );

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }

  // MODAL SUBMIT
  if (
    interaction.isModalSubmit() &&
    interaction.customId === "free_modal"
  ) {
    const link =
      interaction.fields.getTextInputValue(
        "video_link"
      );

    // VALIDATION
    if (
      !link.includes("tiktok.com") ||
      (!link.startsWith("https://") &&
        !link.startsWith("http://"))
    ) {
      return interaction.reply({
        content:
          "❌ Please provide a valid TikTok video link.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      // PLACE ORDER
      const response = await fetch(
        "https://eshopsmm.online/api/v2",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            key: API_KEY,
            action: "add",
            service: SERVICE_ID,
            link: link,
            quantity: QUANTITY,
          }),
        }
      );

      const data = await response.json();

      // SUCCESS
      if (data.order) {
        // SET COOLDOWN
        cooldowns.set(
          interaction.user.id,
          Date.now() + 60 * 60 * 1000
        );

        // USER REPLY
        await interaction.editReply({
          content: `✅ Order placed successfully!

🆔 Order ID: ${data.order}
📦 Amount: 100

⚠️ Cooldown: 1 Hour`,
        });

        // LOG CHANNEL
        const logChannel =
          await client.channels.fetch(
            LOG_CHANNEL_ID
          );

        if (logChannel) {
          await logChannel.send({
            embeds: [
              {
                title:
                  "📢 New Free TikTok Order",
                color: 0x57f287,
                fields: [
                  {
                    name: "User",
                    value: `<@${interaction.user.id}>`,
                  },
                  {
                    name: "Link",
                    value: link,
                  },
                  {
                    name: "Amount",
                    value: "100",
                  },
                  {
                    name: "Order ID",
                    value: String(data.order),
                  },
                ],
                timestamp: new Date(),
              },
            ],
          });
        }
      } else {
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
require("./commands/views")(client);

client.login(TOKEN);
