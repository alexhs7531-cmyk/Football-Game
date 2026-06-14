# Draft Zone League

A two-player, hot-seat football draft + season simulation, inspired by Draft Fantasy's Perfect XI. Spin a club & season, draft one player from that squad into an open slot, swap to the other player, repeat. Build 10 teams each (20 total), simulate a full home-and-away season, and the player whose teams earn the most combined points wins.

It's one self-contained file. No server, no database, no build step, no accounts.

## What's in this folder

- **index.html** — the whole game, with **24 real historical club-versions** built in (264 players + 24 managers, full ratings): Man Utd 1998/99, 2007/08 & 1993/94, Arsenal 2003/04, Barcelona 2010/11 & 2014/15, Real Madrid 2016/17, 2002/03 & 2013/14, Liverpool 2019/20 & 2004/05, Man City 2017/18 & 2022/23, Chelsea 2004/05 & 2020/21, Inter 2009/10, AC Milan 2006/07 & 1993/94, Bayern 2012/13 & 2019/20, Juventus 1996/97, Dortmund 2012/13, PSG 2019/20, Ajax 1994/95.
- **data.json** — the same database as an editable file. The game loads it on startup if present, so it's how you keep a custom database permanently in your repo. Optional, but include it.

## Put it on GitHub Pages and play

1. Create a GitHub repo (or reuse your Draft Zone one).
2. Add **index.html** and **data.json** to the repo root.
3. Repo **Settings -> Pages -> Deploy from a branch -> `main` / `root`** -> Save.
4. After a minute you get a URL like `https://yourname.github.io/your-repo/`. Open it on your screen; your mate watches and you take turns calling the picks.

You can also just double-click index.html to play locally (it works on its own; data.json only loads when served over http, e.g. on Pages).

## How a game runs

1. Enter both player names (Player 1 = amber, Player 2 = cyan).
2. Each round, both name a team.
3. Take turns: **Spin** -> the reels land on a club & season -> draft one player from that squad into an open slot. The manager for that club-version (e.g. Mourinho for Chelsea 2004/05) shows up too and can be drafted into the manager slot. **3 re-spins per team** if you don't fancy the options. Control swaps after every pick.
4. Each team is **1 manager + GK + 4 DEF + 3 MID + 3 FWD**, shown in a 4-3-3 on the pitch. Tap any player to see their full attribute profile.
5. After 10 rounds the season simulates matchday by matchday.
6. Final screen: each player's points total and the winner, Golden Boot / assists / clean sheets, a full sortable player-stats table, and every team's lineup (tap a team).

## Build your own database — add ANY club-version

Open **Manage data** from the start screen.

**In-app editor (no files needed):**
- **+ New club-version** — type a club and season (e.g. `Celta Vigo` / `1999/00`, or `Manchester City` / `2012/13`), fill in the **manager** (name + ratings — every club-version needs one), then **add players** one by one: name, primary position, any number of **secondary positions**, nationality, age, all attributes, and special traits.
- Edit or delete any player, edit ratings, rename or delete a whole club-version.

**Bulk via Excel (CSV):** export `players.csv` / `managers.csv` as templates, edit in Excel, re-import.

**Make it permanent:** **Export data.json** and commit it to your repo root. The game loads it on every device for anyone who opens the link.

Everything you do in the editor is also auto-saved in your browser, so a refresh resumes where you left off.

### CSV columns

players.csv
```
name,club,season,nationality,primaryPosition,secondaryPositions,ageDuringSeason,overall,pace,shooting,passing,creativity,defending,physical,goalkeeping,consistency,bigMatch,leadership,injuryResist,potential,specialTraits
```
managers.csv
```
name,club,season,overall,attackingStyle,defensiveStyle,possession,counterAttack,playerDevelopment,discipline,adaptability,bigMatch
```
- Positions: `GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF`
- `secondaryPositions` and `specialTraits` are pipe-separated, e.g. `CAM|RW` and `Playmaker|Leader`
- Traits the engine understands: `Poacher, Clinical, Playmaker, Maestro, Engine, Wall, Pace Merchant, Leader, Set-Piece, Wing Wizard, Target Man, Sweeper Keeper`
- To complete a game you need at least **220 players** (about 20 GK, 80 DEF, 60 MID, 60 FWD) and **20 managers**.

## How the simulation works (manager + squad both matter)

It's a weighted, ratings-driven model, not a coin-flip. For each match it builds four line strengths — goalkeeper, defence, midfield, attack — from the actual drafted players (with a chemistry penalty if someone's played out of position, and special-trait bonuses applied), then layers the **manager's** tactical profile on top: attacking and defensive style scale the team's output, possession decides who controls the midfield battle, counter-attack rewards the team soaking pressure, and big-match temperament swings the elite fixtures. That resolves into expected goals with a home-advantage bump, and the scoreline is sampled from there. Goals and assists are handed out weighted by finishing, pace, creativity and passing, so strikers score and playmakers assist. Stronger squads and better-suited managers genuinely win more; the same season always replays identically.

## Notes

- Your in-progress game and your data live in this browser (per-browser). `data.json` in the repo is the shared, permanent copy.
- 20 teams x 12 picks is a long sitting by design — that's the full Perfect-XI-style draft. If it drags, fewer rounds is an easy tweak.
