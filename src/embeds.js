const { EmbedBuilder } = require("discord.js");

const RA_BLUE = 0x1a4a7a;
const RA_GOLD = 0xf5c842;
const RA_GREEN = 0x2ecc71;
const RA_RED = 0xe74c3c;

function avatarURL(username) {
  return `https://media.retroachievements.org/UserPic/${username}.png`;
}

function gameImageURL(imageIcon) {
  if (!imageIcon) return null;
  return `https://media.retroachievements.org${imageIcon}`;
}

function medalEmoji(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `**#${rank}**`;
}

function progressBar(earned, total, length = 12) {
  const pct = total > 0 ? earned / total : 0;
  const filled = Math.round(pct * length);
  const bar = "█".repeat(filled) + "░".repeat(length - filled);
  return `\`${bar}\` ${Math.round(pct * 100)}%`;
}

function formatScore(score) {
  if (score === undefined || score === null) return "N/A";
  return score.toLocaleString();
}

// ─── /profile embed ─────────────────────────────────────────────────────────

function buildProfileEmbed(summary, awards, completedGames) {
  const username = summary.User || summary.Username;
  const points = summary.TotalPoints ?? 0;
  const softcore = summary.TotalSoftcorePoints ?? 0;
  const rank = summary.Rank ?? "?";
  const memberSince = summary.MemberSince
    ? new Date(summary.MemberSince).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";

  // Completion stats
  const totalGames = Array.isArray(completedGames) ? completedGames.length : 0;
  const mastered = Array.isArray(completedGames)
    ? completedGames.filter((g) => g.PctWon >= 1 || g.PctWonHC >= 1).length
    : 0;
  const beaten = Array.isArray(completedGames)
    ? completedGames.filter((g) => (g.PctWon >= 0.5 || g.PctWonHC >= 0.5) && !(g.PctWon >= 1 || g.PctWonHC >= 1)).length
    : 0;

  // Awards
  const totalAwards = awards?.VisibleUserAwards?.length ?? 0;
  const masteryAwards = awards?.VisibleUserAwards?.filter((a) =>
    ["Mastery", "Beaten-Hardcore"].includes(a.AwardType)
  ).length ?? 0;

  const embed = new EmbedBuilder()
    .setColor(RA_BLUE)
    .setAuthor({
      name: `RetroAchievements — ${username}`,
      iconURL: "https://retroachievements.org/favicon.ico",
      url: `https://retroachievements.org/user/${username}`,
    })
    .setThumbnail(avatarURL(username))
    .setTitle(`🎮 ${username}'s Profile`)
    .setURL(`https://retroachievements.org/user/${username}`)
    .addFields(
      {
        name: "🏆 Points",
        value: `**${points.toLocaleString()}** hardcore\n${softcore.toLocaleString()} softcore`,
        inline: true,
      },
      {
        name: "🌍 Rank",
        value: rank !== "?" ? `**#${Number(rank).toLocaleString()}**` : "Unranked",
        inline: true,
      },
      {
        name: "📅 Member Since",
        value: memberSince,
        inline: true,
      },
      {
        name: "🎯 Games",
        value: [
          `${totalGames} played`,
          `${mastered} mastered 💯`,
          `${beaten} beaten ✅`,
        ].join("\n"),
        inline: true,
      },
      {
        name: "🏅 Awards",
        value: `${totalAwards} total\n${masteryAwards} mastery`,
        inline: true,
      },
      {
        name: "📊 Last 5 achievements",
        value: buildRecentAchievements(summary.RecentAchievements),
        inline: false,
      }
    )
    .setFooter({ text: "retroachievements.org" })
    .setTimestamp();

  return embed;
}

function buildRecentAchievements(recent) {
  if (!recent || Object.keys(recent).length === 0) return "*No recent achievements*";
  const entries = Object.values(recent).slice(0, 5);
  return entries
    .map((a) => `• **${a.Title}** — *${a.GameTitle}* (+${a.Points}pts)`)
    .join("\n") || "*None*";
}

// ─── /games embed ────────────────────────────────────────────────────────────

function buildGamesEmbed(username, games, page = 0) {
  const PAGE_SIZE = 10;
  const sorted = [...games].sort((a, b) => (b.PctWon ?? 0) - (a.PctWon ?? 0));
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const slice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const lines = slice.map((g) => {
    const pct = Math.round((g.PctWon ?? 0) * 100);
    const hc = Math.round((g.PctWonHC ?? 0) * 100);
    const icon = pct >= 100 ? "💯" : pct >= 50 ? "✅" : "🎮";
    return `${icon} **${g.Title}**\n　${progressBar(pct, 100, 10)} HC: ${hc}%`;
  });

  return new EmbedBuilder()
    .setColor(RA_BLUE)
    .setAuthor({
      name: `${username} — Game Progress`,
      iconURL: avatarURL(username),
      url: `https://retroachievements.org/user/${username}`,
    })
    .setTitle(`🎮 Games Played (${games.length} total)`)
    .setDescription(lines.join("\n") || "*No games found*")
    .setFooter({ text: `Page ${page + 1}/${totalPages} • sorted by completion` })
    .setTimestamp();
}

// ─── /leaderboard game embed ─────────────────────────────────────────────────

function buildLeaderboardsEmbed(gameInfo, leaderboards) {
  const lbList = leaderboards?.Results ?? [];
  const embed = new EmbedBuilder()
    .setColor(RA_GOLD)
    .setTitle(`🏆 Leaderboards — ${gameInfo.Title}`)
    .setURL(`https://retroachievements.org/game/${gameInfo.ID}`)
    .setThumbnail(gameImageURL(gameInfo.ImageIcon));

  if (lbList.length === 0) {
    embed.setDescription("*No leaderboards found for this game.*");
    return embed;
  }

  const fields = lbList.slice(0, 10).map((lb) => ({
    name: `📋 ${lb.Title}`,
    value: `${lb.Description || "No description"}\nEntries: **${lb.Entries ?? "?"}**`,
    inline: false,
  }));

  embed
    .setDescription(`**${lbList.length}** leaderboard(s) found. Use \`/lb-entries\` to see rankings.`)
    .addFields(fields)
    .setFooter({ text: `Game ID: ${gameInfo.ID}` });

  return embed;
}

// ─── /lb-entries embed ───────────────────────────────────────────────────────

function buildLbEntriesEmbed(lbTitle, entries) {
  const rows = entries?.Results ?? [];

  const lines = rows.slice(0, 15).map((e) => {
    const rank = e.Rank ?? e.rank ?? "?";
    const user = e.User ?? e.user ?? "?";
    const score = e.FormattedScore ?? e.Score ?? "?";
    return `${medalEmoji(rank)} **${user}** — ${score}`;
  });

  return new EmbedBuilder()
    .setColor(RA_GOLD)
    .setTitle(`🏅 ${lbTitle}`)
    .setDescription(lines.join("\n") || "*No entries*")
    .setFooter({ text: "Top 15 entries" })
    .setTimestamp();
}

// ─── /link / /unlink embeds ──────────────────────────────────────────────────

function buildLinkSuccessEmbed(discordTag, raUsername) {
  return new EmbedBuilder()
    .setColor(RA_GREEN)
    .setTitle("✅ Account Linked!")
    .setDescription(
      `**${discordTag}** is now linked to RetroAchievements account **${raUsername}**.\n\nUse \`/profile\` without any username to view your profile!`
    )
    .setThumbnail(avatarURL(raUsername))
    .setTimestamp();
}

function buildUnlinkEmbed(raUsername) {
  return new EmbedBuilder()
    .setColor(RA_RED)
    .setTitle("🔗 Account Unlinked")
    .setDescription(`Your link to **${raUsername}** has been removed.`)
    .setTimestamp();
}

function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor(RA_RED)
    .setTitle("❌ Error")
    .setDescription(message)
    .setTimestamp();
}

module.exports = {
  buildProfileEmbed,
  buildGamesEmbed,
  buildLeaderboardsEmbed,
  buildLbEntriesEmbed,
  buildLinkSuccessEmbed,
  buildUnlinkEmbed,
  buildErrorEmbed,
  progressBar,
  medalEmoji,
};
