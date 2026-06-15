const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "accounts.db"));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS linked_accounts (
    discord_id   TEXT PRIMARY KEY,
    discord_tag  TEXT NOT NULL,
    ra_username  TEXT NOT NULL,
    linked_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ra_username ON linked_accounts (ra_username);
`);

const DB = {
  linkAccount(discordId, discordTag, raUsername) {
    const stmt = db.prepare(`
      INSERT INTO linked_accounts (discord_id, discord_tag, ra_username, linked_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        discord_tag = excluded.discord_tag,
        ra_username = excluded.ra_username,
        linked_at   = excluded.linked_at
    `);
    stmt.run(discordId, discordTag, raUsername, Date.now());
  },

  unlinkAccount(discordId) {
    db.prepare("DELETE FROM linked_accounts WHERE discord_id = ?").run(discordId);
  },

  getLinkedAccount(discordId) {
    return db
      .prepare("SELECT * FROM linked_accounts WHERE discord_id = ?")
      .get(discordId);
  },

  getByRAUsername(raUsername) {
    return db
      .prepare("SELECT * FROM linked_accounts WHERE LOWER(ra_username) = LOWER(?)")
      .get(raUsername);
  },
};

module.exports = DB;
