const OWNER_ID = "1487485450833756235";

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    // Ignore bots
    if (message.author.bot) return;

    // Owner only
    if (message.author.id !== OWNER_ID) return;

    // Command check
    if (!message.content.startsWith(".dm")) return;

    const args = message.content.split(" ");

    // Validation
    if (args.length < 3) {
      return message.reply(
        "Usage: .dm <user_id> <message>"
      );
    }

    const userId = args[1];
    const customMessage = args.slice(2).join(" ");

    try {
      // Fetch user
      const user = await client.users.fetch(userId);

      // Send DM
      await user.send(customMessage);

      // Confirm to owner
      await message.reply("✅ DM sent successfully.");
    } catch (err) {
      console.error(err);

      await message.reply(
        "❌ Failed to send DM to that user."
      );
    }
  });
};
