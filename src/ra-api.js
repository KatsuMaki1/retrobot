const axios = require("axios");

const BASE_URL = "https://retroachievements.org/API";
const API_KEY = process.env.RA_API_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

function params(extra = {}) {
  return { z: "discord-bot", y: API_KEY, ...extra };
}

const RA = {
  async getUserSummary(username) {
    const res = await api.get("/API_GetUserSummary.php", {
      params: params({ u: username, g: 10, a: 5 }),
    });
    return res.data;
  },

  async getUserRecentAchievements(username, count = 10) {
    const res = await api.get("/API_GetUserRecentAchievements.php", {
      params: params({ u: username, c: count }),
    });
    return res.data;
  },

  async getUserCompletedGames(username) {
    const res = await api.get("/API_GetUserCompletedGames.php", {
      params: params({ u: username }),
    });
    return res.data;
  },

  async getUserAwards(username) {
    const res = await api.get("/API_GetUserAwards.php", {
      params: params({ u: username }),
    });
    return res.data;
  },

  async getGameInfo(gameId) {
    const res = await api.get("/API_GetGameExtended.php", {
      params: params({ i: gameId }),
    });
    return res.data;
  },

  async getGameLeaderboards(gameId) {
    const res = await api.get("/API_GetGameLeaderboards.php", {
      params: params({ i: gameId, c: 25, o: 0 }),
    });
    return res.data;
  },

  async getLeaderboardEntries(lbId, count = 10) {
    const res = await api.get("/API_GetLeaderboardEntries.php", {
      params: params({ i: lbId, c: count }),
    });
    return res.data;
  },

  async getUserGameProgress(username, gameId) {
    const res = await api.get("/API_GetGameInfoAndUserProgress.php", {
      params: params({ u: username, g: gameId }),
    });
    return res.data;
  },

  async getUserProfile(username) {
    const res = await api.get("/API_GetUserProfile.php", {
      params: params({ u: username }),
    });
    return res.data;
  },

  async searchUsers(query) {
    // RA doesn't have a search API — we just try to fetch the exact username
    try {
      const profile = await RA.getUserProfile(query);
      return profile?.User ? [profile] : [];
    } catch {
      return [];
    }
  },
};

module.exports = RA;
