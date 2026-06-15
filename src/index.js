require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const RA = require("./ra-api");
const DB = require("./database");
const {
  buildProfileEmbed,
  buildGamesEmbed,
  buildLeaderboardsEmbed,
  buildLbEntriesEmbed,
  buildLinkSuccessEmbed,
  buildUnlinkEmbed,
  buildErrorEmbed,
  progressBar,
  medalEmoji,
} = require("./embeds");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve RA username: from option, or from linked account */
async function resolveUsername(interaction, optionName = "username") {
  const provided = interaction.options.getString(optionName);
  if (provided) return provided.trim();

  const linked = DB.getLinkedAccount(interaction.user.id);
  if (linked) return linked.ra_username;

  return null;
}

function noAccountError(interaction) {
  return interaction.editReply({
    embeds: [
      buildErrorEmbed(
        "No RA username provided and no linked account found.\n" +
          "Use `/link <username>` to connect your RetroAchievements account, " +
          "or provide a `username` argument."
      ),
    ],
  });
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

const handlers = {
  // ── /profile ──────────────────────────────────────────────────────────────
  async profile(interaction) {
    await interaction.deferReply();

    const username = await resolveUsername(interaction);
    if (!username) return noAccountError(interaction);

    try {
      const [summary, awards, completed] = await Promise.all([
        RA.getUserSummary(username),
        RA.getUserAwards(username),
        RA.getUserCompletedGames(username),
      ]);

      if (!summary?.User && !summary?.Username) {
        return interaction.editReply({
          embeds: [buildErrorEmbed(`User **${username}** not found on RetroAchievements.`)],
        });
      }

      const embed = buildProfileEmbed(summary, awards, completed);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/profile]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to fetch profile. Is the username correct?")],
      });
    }
  },

  // ── /games ────────────────────────────────────────────────────────────────
  async games(interaction) {
    await interaction.deferReply();

    const username = await resolveUsername(interaction);
    if (!username) return noAccountError(interaction);

    const page = (interaction.options.getInteger("page") ?? 1) - 1;

    try {
      const games = await RA.getUserCompletedGames(username);

      if (!Array.isArray(games) || games.length === 0) {
        return interaction.editReply({
          embeds: [buildErrorEmbed(`No games found for **${username}**.`)],
        });
      }

      const embed = buildGamesEmbed(username, games, page);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/games]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to fetch games data.")],
      });
    }
  },

  // ── /leaderboards ─────────────────────────────────────────────────────────
  async leaderboards(interaction) {
    await interaction.deferReply();

    const gameId = interaction.options.getInteger("game-id");

    try {
      const [gameInfo, leaderboards] = await Promise.all([
        RA.getGameInfo(gameId),
        RA.getGameLeaderboards(gameId),
      ]);

      if (!gameInfo?.ID) {
        return interaction.editReply({
          embeds: [buildErrorEmbed(`Game with ID **${gameId}** not found.`)],
        });
      }

      const embed = buildLeaderboardsEmbed(gameInfo, leaderboards);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/leaderboards]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to fetch leaderboard data.")],
      });
    }
  },

  // ── /lb-entries ───────────────────────────────────────────────────────────
  async ["lb-entries"](interaction) {
    await interaction.deferReply();

    const lbId = interaction.options.getInteger("leaderboard-id");
    const title = interaction.options.getString("title") ?? `Leaderboard #${lbId}`;

    try {
      const entries = await RA.getLeaderboardEntries(lbId, 15);
      const embed = buildLbEntriesEmbed(title, entries);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/lb-entries]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to fetch leaderboard entries.")],
      });
    }
  },

  // ── /recent ───────────────────────────────────────────────────────────────
  async recent(interaction) {
    await interaction.deferReply();

    const username = await resolveUsername(interaction);
    if (!username) return noAccountError(interaction);

    const count = interaction.options.getInteger("count") ?? 10;

    try {
      const achievements = await RA.getUserRecentAchievements(username, count);

      if (!Array.isArray(achievements) || achievements.length === 0) {
        return interaction.editReply({
          embeds: [buildErrorEmbed(`No recent achievements found for **${username}**.`)],
        });
      }

      const lines = achievements.map((a) => {
        const date = new Date(a.Date).toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const hc = a.HardcoreMode == 1 ? " 🔒" : "";
        return `• **${a.Title}**${hc} (+${a.Points}pts)\n　*${a.GameTitle}* — ${date}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x1a4a7a)
        .setAuthor({
          name: `${username} — Recent Achievements`,
          iconURL: `https://media.retroachievements.org/UserPic/${username}.png`,
          url: `https://retroachievements.org/user/${username}`,
        })
        .setTitle(`🏆 Last ${achievements.length} achievements`)
        .setDescription(lines.join("\n"))
        .setFooter({ text: "🔒 = Hardcore mode" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/recent]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to fetch recent achievements.")],
      });
    }
  },

  // ── /link ─────────────────────────────────────────────────────────────────
  async link(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const raUsername = interaction.options.getString("username").trim();

    try {
      // Verify the account exists on RA
      const profile = await RA.getUserProfile(raUsername);

      if (!profile?.User) {
        return interaction.editReply({
          embeds: [
            buildErrorEmbed(
              `Could not find **${raUsername}** on RetroAchievements.\n` +
                "Please double-check the username and try again."
            ),
          ],
        });
      }

      const confirmedUsername = profile.User; // use the correctly-cased version
      DB.linkAccount(interaction.user.id, interaction.user.tag, confirmedUsername);

      const embed = buildLinkSuccessEmbed(interaction.user.tag, confirmedUsername);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[/link]", err.message);
      await interaction.editReply({
        embeds: [buildErrorEmbed("Failed to verify the RA account. Try again later.")],
      });
    }
  },

  // ── /unlink ───────────────────────────────────────────────────────────────
  async unlink(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const linked = DB.getLinkedAccount(interaction.user.id);
    if (!linked) {
      return interaction.editReply({
        embeds: [buildErrorEmbed("You don't have a linked RetroAchievements account.")],
      });
    }

    DB.unlinkAccount(interaction.user.id);
    await interaction.editReply({ embeds: [buildUnlinkEmbed(linked.ra_username)] });
  },

  // ── /whoami ───────────────────────────────────────────────────────────────
  async whoami(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const linked = DB.getLinkedAccount(interaction.user.id);
    if (!linked) {
      return interaction.editReply({
        embeds: [
          buildErrorEmbed(
            "You have no linked RetroAchievements account.\nUse `/link <username>` to connect one."
          ),
        ],
      });
    }

    const date = new Date(linked.linked_at).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🔗 Your linked account")
      .setDescription(
        `Linked to **[${linked.ra_username}](https://retroachievements.org/user/${linked.ra_username})**\n` +
          `Linked on ${date}`
      )
      .setThumbnail(`https://media.retroachievements.org/UserPic/${linked.ra_username}.png`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

// ─── Event: Ready ─────────────────────────────────────────────────────────────

client.once("ready", () => {
  console.log(`✅ Bot ready! Logged in as ${client.user.tag}`);
  client.user.setActivity("RetroAchievements 🎮", { type: 0 }); // 0 = PLAYING
});

// ─── Event: Interaction ───────────────────────────────────────────────────────

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const handler = handlers[interaction.commandName];
  if (!handler) return;

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`[${interaction.commandName}] Unhandled error:`, err);
    const reply = { embeds: [buildErrorEmbed("An unexpected error occurred.")] };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply({ ...reply, ephemeral: true }).catch(() => {});
    }
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(process.env.DISCORD_TOKEN);
