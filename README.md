# 🎮 RetroAchievements Discord Bot

A Discord bot that brings RetroAchievements directly into your server — profile viewer, game progress, leaderboards, and account linking.

---

## Commands

| Command | Description |
|---|---|
| `/profile [username]` | View a full RA profile (points, rank, awards, recent achievements) |
| `/games [username] [page]` | Browse all games played with completion progress |
| `/recent [username] [count]` | Show recently unlocked achievements |
| `/leaderboards <game-id>` | List all leaderboards for a game |
| `/lb-entries <leaderboard-id>` | View top 15 entries for a leaderboard |
| `/link <username>` | Link your Discord to your RA account |
| `/unlink` | Remove your linked account |
| `/whoami` | Check which RA account is linked to you |

> All commands that take a `username` argument will use your **linked account** if no username is provided.

---

## Setup

### 1. Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application** → give it a name
3. Go to **Bot** tab → click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it — this is your `DISCORD_TOKEN`
5. Scroll down and enable **Applications Commands** under Privileged Gateway Intents (not required, but good practice)
6. Copy the **Application ID** from the **General Information** tab — this is your `CLIENT_ID`

### 2. Invite the Bot to Your Server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

Open the generated URL and invite it to your server.

### 3. Get a RetroAchievements API Key

1. Log in at https://retroachievements.org
2. Go to **Settings** (top right)
3. Scroll to **API Key** and copy it — this is your `RA_API_KEY`

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your three values:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
RA_API_KEY=your_ra_api_key
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Deploy Slash Commands

```bash
npm run deploy
```

This registers all slash commands with Discord. Only needs to be run once (or when you add new commands).

### 7. Start the Bot

```bash
npm start
```

---

## Hosting Options

### 🟢 Option A — Railway (Recommended, easiest, free tier available)

1. Push your code to a GitHub repo
2. Go to https://railway.app and sign up with GitHub
3. Click **New Project → Deploy from GitHub repo**
4. Select your repo
5. Go to **Variables** tab and add your three env vars:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `RA_API_KEY`
6. Railway auto-detects Node.js and runs `npm start`
7. Done — bot stays online 24/7

**Cost:** Free tier gives $5 of credits/month, enough for a small bot.

---

### 🟡 Option B — Fly.io (Free, slightly more setup)

1. Install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. In your project folder:

```bash
fly auth login
fly launch        # follow the prompts, say NO to Postgres
fly secrets set DISCORD_TOKEN=xxx CLIENT_ID=xxx RA_API_KEY=xxx
fly deploy
```

**Cost:** Free for apps under the free allowance (256 MB RAM, which is plenty).

---

### 🟠 Option C — VPS (Full control, ~$4–6/month)

Use any VPS (DigitalOcean Droplet, Hetzner, Vultr, etc.):

```bash
# On the server
sudo apt update && sudo apt install nodejs npm git -y
git clone https://github.com/yourusername/retrobot.git
cd retrobot
npm install
cp .env.example .env
nano .env   # fill in your values

# Run with pm2 so it auto-restarts
npm install -g pm2
pm2 start src/index.js --name retrobot
pm2 startup   # follow the printed command to auto-start on reboot
pm2 save
```

---

### 🔵 Option D — Local / Always-on PC

Just run:
```bash
npm start
```
Works fine as long as the machine stays on. Use `nodemon` (`npm run dev`) during development for auto-reload.

---

## File Structure

```
retrobot/
├── src/
│   ├── index.js          # Main bot + command handlers
│   ├── commands.js       # Slash command definitions
│   ├── ra-api.js         # RetroAchievements API wrapper
│   ├── database.js       # SQLite (account linking)
│   ├── embeds.js         # Discord embed builders
│   └── deploy-commands.js # One-time command registration
├── data/
│   └── accounts.db       # Auto-created SQLite DB (gitignored)
├── .env                  # Your secrets (gitignored)
├── .env.example          # Template
└── package.json
```

---

## Finding Game IDs

Game IDs are in the URL on RetroAchievements:
`https://retroachievements.org/game/1` → game ID is `1`

Use `/leaderboards 1` to see that game's leaderboards, then use the shown IDs with `/lb-entries`.

---

## Tips

- `/link` and `/unlink` and `/whoami` reply **only to you** (ephemeral) for privacy
- Linked accounts are stored in a local SQLite DB in the `data/` folder
- The bot uses the **official RetroAchievements API** — it respects rate limits automatically
