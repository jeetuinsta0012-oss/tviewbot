module.exports = (client) => {
  const OWNER_ID = "1487485450833756235";

  const API_KEY = process.env.SMM_API_KEY;

  const SERVICE_ID = "668";

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // .views <link> <amount>
    if (message.content.startsWith(".views")) {
      // OWNER CHECK
      if (message.author.id !== OWNER_ID) {
        return message.reply(
          "❌ You are not allowed to use this command."
        );
      }

      const args = message.content.split(" ");

      const link = args[1];
      const amount = args[2];

      // CHECK ARGUMENTS
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
      if (isNaN(amount)) {
        return message.reply(
          "❌ Amount must be a number."
        );
      }

      try {
        await message.reply(
          "⏳ Placing order..."
        );

        // API REQUEST
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
              quantity: amount,
            }),
          }
        );

        const data = await response.json();

        // SUCCESS
        if (data.order) {
          return message.reply({
            content: `✅ Order placed successfully!

🆔 Order ID: ${data.order}
📦 Amount: ${amount}
🔗 Link: ${link}`,
          });
        }

        // API ERROR
        return message.reply({
          content: `❌ Failed to place order.

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\``,
        });
      } catch (error) {
        console.error(error);

        return message.reply(
          "❌ An error occurred while placing the order."
        );
      }
    }
  });
};
