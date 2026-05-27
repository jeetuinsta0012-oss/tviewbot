module.exports = (client) => {
  const OWNER_ID = "1487485450833756235";
  const API_KEY = process.env.SMM_API_KEY;
  const SERVICE_ID = "668";

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith(".views")) return;

    // OWNER CHECK
    if (message.author.id !== OWNER_ID) {
      return message.reply(
        "❌ You are not allowed to use this command."
      );
    }

    const args = message.content.trim().split(/\s+/);

    // .views <link> <amount>
    const link = args[1];
    const amount = parseInt(args[2]);

    // VALIDATION
    if (!link || !amount) {
      return message.reply(
        "❌ Usage:\n.views <tiktok_link> <amount>"
      );
    }

    // VALIDATE LINK
    if (
      !link.includes("tiktok.com") ||
      (!link.startsWith("https://") &&
        !link.startsWith("http://"))
    ) {
      return message.reply(
        "❌ Please provide a valid TikTok link."
      );
    }

    // VALIDATE AMOUNT
    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        "❌ Amount must be a valid number."
      );
    }

    // CHECK API KEY
    if (!API_KEY) {
      return message.reply(
        "❌ Missing SMM_API_KEY in environment variables."
      );
    }

    try {
      const msg = await message.reply(
        "⏳ Placing order..."
      );

      const params = new URLSearchParams();
      params.append("key", API_KEY);
      params.append("action", "add");
      params.append("service", SERVICE_ID);
      params.append("link", link);
      params.append("quantity", amount);

      const response = await fetch(
        "https://eshopsmm.online/api/v2",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: params,
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        return msg.edit(
          `❌ Invalid API response:\n\`\`\`\n${text}\n\`\`\``
        );
      }

      // SUCCESS
      if (data.order) {
        return msg.edit(
          `✅ Order placed successfully!

🆔 Order ID: ${data.order}
📦 Amount: ${amount}
🔗 Link: ${link}`
        );
      }

      // API ERROR
      return msg.edit(
        `❌ Failed to place order.

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``
      );
    } catch (error) {
      console.error("Views Command Error:", error);

      return message.reply(
        `❌ Error occurred:\n\`${error.message}\``
      );
    }
  });
};
