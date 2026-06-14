# Draft Zone League

A two-player, hot-seat football game. Each player builds **ten teams** by spending a transfer
budget on real players and managers, then all twenty teams play a full home-and-away season.
The deeper, Football-Manager-style engine decides every result, and the player whose ten teams
earn the **most combined league points** wins.

Everything runs in a single self-contained `index.html` — no install, no server, no internet
needed once it's open. Drop it on GitHub Pages (or open the file locally) and play.

---

## How a game works

1. **Names.** Enter both players. Each starts with the same pot (default **£10bn**).
2. **Player 1 builds all ten teams first, then Player 2.** For every team:
   - **Pick a formation** — thirteen FM-style shapes (4-3-3, 4-4-2, 4-2-3-1, 4-3-2-1,
     4-1-2-1-2, 4-2-2-2, 4-5-1, 4-4-1-1, 3-4-3, 3-5-2, 5-3-2, 5-4-1, 5-2-3).
   - **Allocate a budget** to that team from your remaining pot. Whatever you don't spend
     stays in the pot for your later teams.
   - **Sign players.** Click any position on the pitch (or the manager slot) to open the
     market: everyone who can play there, sorted by value, with a coloured rating badge and a
     fee. Search by name/club, sort by value or rating, filter by maximum value, or show only
     what you can afford. Open a player to see their full attribute profile, then **Sign**.
3. **Uniqueness.** Each player and manager can be signed **once** across all twenty teams.
   A player with multiple positions (e.g. prime Messi at RW/CF/CAM) shows up in each of those
   markets until someone signs him.
4. **Simulate.** Once all twenty teams are built, the season plays out — 380 matches.
5. **Result.** A combined-points winner, plus a full league table, top scorers, assists, clean
   sheets, biggest results and every squad. **New game** resets everything from scratch.

### The money model
- Your pot is divided across your ten teams however you like; a team can only spend up to the
  budget you give it, and the pot drops by what you actually spend.
- The game guarantees you can always complete all ten teams: it reserves enough for the
  cheapest valid completion of your remaining teams, so you can never strand yourself. If you
  splurge early, expensive formations simply become unavailable later (the cheapest shapes are
  always affordable).
- Values run to the nearest £1m, from a few million up to ~£424m for prime Messi.

---

## Attributes & ratings

Every player has the full Football-Manager attribute set, each rated **/99**:

- **Technical** — Corners, Crossing, Dribbling, Finishing, First Touch, Free Kicks, Heading,
  Long Shots, Long Throws, Marking, Passing, Penalties, Tackling, Technique
- **Mental** — Aggression, Anticipation, Bravery, Composure, Concentration, Decisions,
  Determination, Flair, Leadership, Off The Ball, Positioning, Teamwork, Vision, Work Rate
- **Physical** — Acceleration, Agility, Balance, Jumping Reach, Natural Fitness, Pace, Stamina,
  Strength
- **Goalkeeping** (keepers only) — Aerial Reach, Command of Area, Communication, Eccentricity,
  Handling, Kicking, One on Ones, Punching, Reflexes, Rushing Out, Throwing

Managers get their own /99 attributes (Adaptability, Attacking, Defending, Determination,
Discipline, Fitness, Level of Discipline, Man Management, Mental, Motivating, People Management,
Tactical, Technical) plus an overall rating.

**Colour scale** (used on every rating): the better the number, the darker the purple, then
dark green, lighter green, yellow, orange and red — so a 99 is deep purple, ~94 dark green,
~90 green, dropping through yellow to red for low ratings.

---

## How the simulation works

It's attribute-led — player quality is the biggest factor, with the manager and formation
shaping how that quality is expressed:

- Each player's attributes are blended into role scores (defending, midfield control, chance
  creation, goal threat, goalkeeping). Attack and creation use a mean/max blend, so a single
  superstar genuinely lifts the whole side — a prime Messi is near unstoppable.
- The back line is weighted toward its weakest link; formation counts scale each line (more
  forwards = more threat, five at the back = more resistance).
- The **manager** applies attacking/defending modifiers, a squad-cohesion boost from
  man-management and the squad's teamwork, and a **formation-fit** bonus that rewards a manager
  whose attacking/defensive lean (amplified by Tactical) matches the shape — and quietly
  punishes a mismatch.
- Matches resolve as expected goals from attack-vs-defence (quality differences compound),
  possession from midfield control, a home-advantage edge and a big-match swing between two
  elite sides, then sampled to a scoreline. Players are credited with goals and assists by the
  relevant attributes, so the elite forwards top the scoring and the playmakers top assists.

---

## Editing the database (the backend)

The whole dataset lives in **`data.json`**: `{ "config": { "budget": 10000 }, "players": [...],
"managers": [...] }`, with every player's overall, market value, positions and full attribute
set, and every manager. Three ways to edit it:

- **In-app** — open **Manage data** from the start screen to add/edit/delete players and
  managers (full attribute grids, with an "auto-fill from overall" helper), change the starting
  pot, and export `data.json`.
- **CSV** — export players and managers to CSV, bulk-edit in a spreadsheet (every attribute is
  a column, including goalkeeping), and import them back. Missing attributes are auto-derived
  from a player's position and overall.
- **In the repo** — edit `build-data.js` (the squad list and the value/attribute generators)
  and run `node build-data.js` to regenerate `data.json` and rebuild `index.html`.

---

## Deploying on GitHub Pages

`index.html` is fully standalone — the dataset is embedded inside it, so just commit it and
enable Pages (or open the file directly). `data.json` and the CSVs are only needed if you want
to edit the database.

> Note: the in-chat preview may not persist saves (it can't use browser storage), but the game
> still runs because the data is embedded. Served on Pages or locally, saves persist between
> sessions.

## Files

- `index.html` — the playable game (open this).
- `data.json` — the dataset, for editing / version control.
- `build-data.js` + `draft-zone-league.html` — the source: squad data and generators, plus the
  template `index.html` is built from. Run `node build-data.js` to regenerate.
- `README.md` — this file.
