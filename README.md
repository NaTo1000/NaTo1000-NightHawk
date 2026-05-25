# 🦅 NightHawk – System of Glory

A full glory/achievement/leaderboard system built as a web application.

## Features

- **Player management** – add and remove players
- **Glory points** – award points to players; achievements unlock automatically as thresholds are crossed
- **Achievements** – 10 unique achievements with bonus point rewards (First Blood, Century, Unstoppable, Legendary, Mythic Rise, Glory Ascent, Hat Trick, Collector, Completionist, NightHawk)
- **Rank tiers** – 6 tiers from *Recruit* through *Glory*, based on total points
- **Live leaderboard** – top-10 players sorted by glory points
- **Persistent storage** – player data is saved to `localStorage` and survives page reloads
- **Toast notifications** – real-time feedback for awarded points and unlocked achievements

## Rank Tiers

| Tier       | Points Required |
|------------|-----------------|
| Recruit    | 0               |
| Warrior    | 100             |
| Champion   | 500             |
| Legend     | 1,500           |
| Mythic     | 4,000           |
| **Glory**  | 10 000          |

## Getting Started

Open `index.html` in any modern browser — no build step or server required.

## Running Tests

```bash
node tests/glory.test.js
```

## Project Structure

```
├── index.html          # Main UI
├── src/
│   ├── glory.js        # Core glory engine (GlorySystem class)
│   └── app.js          # DOM/UI controller
├── styles/
│   └── main.css        # Dark-theme stylesheet
└── tests/
    └── glory.test.js   # Unit tests (plain Node, no dependencies)
```