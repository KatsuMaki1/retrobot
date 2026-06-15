require("dotenv").config();
const { REST, Routes } = require("discord.js");
const commands = require("./commands");

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 Deploying slash commands...");

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${data.length} slash commands globally.`);
    console.log("   Note: global commands can take up to 1 hour to propagate.");
    console.log("\n   Commands registered:");
    data.forEach((cmd) => console.log(`   /${cmd.name} — ${cmd.description}`));
  } catch (err) {
    console.error("❌ Failed to deploy commands:", err);
    process.exit(1);
  }
})();
