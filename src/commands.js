const { SlashCommandBuilder } = require("discord.js");

const commands = [
  // ── /profile ──────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a RetroAchievements profile")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("RA username (leave empty to use your linked account)")
        .setRequired(false)
    ),

  // ── /games ────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("games")
    .setDescription("Browse games played by a RA user")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("RA username (leave empty to use your linked account)")
        .setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("page")
        .setDescription("Page number (default: 1)")
        .setRequired(false)
        .setMinValue(1)
    ),

  // ── /leaderboards ─────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("leaderboards")
    .setDescription("View leaderboards for a specific game")
    .addIntegerOption((opt) =>
      opt
        .setName("game-id")
        .setDescription("The RetroAchievements game ID (found in the game URL)")
        .setRequired(true)
    ),

  // ── /lb-entries ───────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("lb-entries")
    .setDescription("View top entries for a specific leaderboard")
    .addIntegerOption((opt) =>
      opt
        .setName("leaderboard-id")
        .setDescription("The leaderboard ID (from /leaderboards)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("title")
        .setDescription("Custom label for the leaderboard (optional)")
        .setRequired(false)
    ),

  // ── /link ─────────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to your RetroAchievements profile")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("Your RetroAchievements username")
        .setRequired(true)
    ),

  // ── /unlink ───────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Unlink your Discord account from RetroAchievements"),

  // ── /whoami ───────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("whoami")
    .setDescription("Check which RA account is linked to your Discord"),

  // ── /recent ───────────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName("recent")
    .setDescription("Show recent achievements unlocked by a user")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("RA username (leave empty to use your linked account)")
        .setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("count")
        .setDescription("Number of achievements to show (default: 10, max: 20)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),
];

module.exports = commands.map((c) => c.toJSON());
