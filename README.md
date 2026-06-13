# Draft Zone League

A private, two-player football drafting + season-simulation game inspired by Draft Fantasy's "Perfect XI", with **your own fully editable database** of historical club-versions, players and managers.

Two players join a shared room, take turns drafting 10 teams each (20 total), and the app simulates a full 38-matchday double round-robin season. The winner is the **player** whose 10 teams collectively earn the most league points.

---

## How this is being built

This is a real full-stack application (frontend + backend + database + sockets + admin + engine), so it's built in **phases**, foundation-first. Each phase is complete and tested before the next — no stubs, no placeholder systems.

| Phase | Scope | Status |
|---|---|---|
| **0. Foundation** | Repo layout, Prisma schema, shared types | ✅ done |
| **1. Engine** | Simulation engine, fixture generator, seeded RNG, tests | ✅ done |
| **2. Backend core** | Express server, Prisma client, DB-backed game state | next |
| **3. Real-time** | Socket.IO rooms, draft turn logic, reconnect/recovery | next |
| **4. Admin** | CSV import/export, CRUD for clubs/players/managers | next |
| **5. Frontend** | React + Vite + Tailwind: lobby, draft, league, results | next |
| **6. Auth + deploy** | Shared-password gate, Railway (backend) + Vercel (frontend) | next |

Everything done so far lives under `server/`. The pieces below are the keystones the rest hangs off.

---

## Architecture

```
draft-zone-league/
├── server/                      # Node + Express + Socket.IO + Prisma  → Railway
│   ├── prisma/schema.prisma     # ✅ full data model (catalogue + game state)
│   ├── src/
│   │   ├── types/shared.ts      # ✅ shared contract (squad structure, sim types)
│   │   ├── simulation/
│   │   │   ├── rng.ts           # ✅ seeded RNG + Poisson sampling
│   │   │   ├── engine.ts        # ✅ weighted ratings-driven match engine
│   │   │   └── fixtures.ts      # ✅ double round-robin generator
│   │   ├── routes/              # (phase 2/4) REST: admin, game lookups
│   │   ├── sockets/             # (phase 3) Socket.IO event handlers
│   │   └── index.ts             # (phase 2) server entry
│   └── package.json
└── client/                      # React + Vite + Tailwind  → Vercel  (phase 5)
```

**Why a backend at all:** your current Draft Zone is a static GitHub Pages site, which can't do real-time turn-passing between two remote browsers or keep a shared database. That's exactly why the Vercel (frontend) + Railway (backend + Postgres) split is the right call — the path you chose.

---

## The data model (the part you most cared about)

All football data is **data-driven** — no hardcoding, no code changes to add teams. The model cleanly supports historical versions:

- A **Season** is a label like `1998/99`.
- A **Club** is a *specific historical version*: "Manchester United 1998/99" and "Manchester United 2007/08" are two separate `Club` rows (each with attack/midfield/defence/GK ratings).
- A **Player** is an identity; a **PlayerRating** is that player *as they were in one club-version* (all 13 attributes + age that season). The **draft pool is made of PlayerRatings**, so the same player can appear as multiple historical cards.
- A **Manager** / **ManagerRating** works the same way and is drafted as the 12th selection.

This is why you can have "Beckham @ Man Utd 1998/99" and "Beckham @ Real Madrid 2003/04" as distinct draftable cards.

---

## The simulation engine (the most important requirement)

`server/src/simulation/engine.ts` — a **weighted, ratings-driven model**, not a random generator. For each match it:

1. Computes four **line strengths** (GK, DEF, MID, ATT) from the actual drafted players, using each attribute meaningfully (e.g. forwards weight shooting/pace/creativity; defenders weight defending/physical/pace).
2. Resolves the **midfield battle** into a possession share (boosted by manager possession rating).
3. Converts attack-vs-opponent-resistance into **expected goals (xG)** with power scaling, so squad-quality gaps create meaningfully varied scorelines.
4. Applies **home advantage**, **counter-attack** value for low-possession sides, and a **big-match swing** in close games between two strong teams.
5. Samples actual goals from a **Poisson distribution** (seeded → reproducible).
6. Attributes **scorers and assists** to players weighted by their attributes (feeds top-scorer / top-assist tables and player profiles).

Manager traits (attacking/defensive style, possession, counter-attack, discipline, adaptability, big-match) all feed in as modifiers. Tuning constants (`BASE_GOALS`, `QUALITY_EXPONENT`, `HOME_ADVANTAGE`, etc.) are centralised at the top of the file.

Verified behaviour (1,000-game samples): a 90-rated side beats a 62-rated side ~91% of the time averaging ~3.7–0.6; evenly matched sides split ~42/23/34 home/draw/away; identical seeds reproduce identical scores.

---

## CSV import formats (admin, phase 4)

Three import types. Headers are exact; `secondaryPositions` and `specialTraits` are `|`-separated.

**clubs.csv**
```
name,season,country,league,overallRating,attackRating,midfieldRating,defenceRating,goalkeepingRating
Manchester United,1998/99,England,Premier League,90,89,88,87,86
Arsenal,2003/04,England,Premier League,91,90,89,90,85
Barcelona,2010/11,Spain,La Liga,94,95,96,90,88
```

**managers.csv** (`club` + `season` resolve to the club-version)
```
name,club,season,overall,attackingStyle,defensiveStyle,possession,counterAttack,playerDevelopment,discipline,adaptability,bigMatch
Alex Ferguson,Manchester United,1998/99,93,82,80,75,78,90,70,88,92
Arsene Wenger,Arsenal,2003/04,90,88,78,85,72,92,65,80,85
Pep Guardiola,Barcelona,2010/11,95,95,82,99,60,88,75,90,90
```

**players.csv** (`club` + `season` resolve to the club-version)
```
name,club,season,nationality,primaryPosition,secondaryPositions,ageDuringSeason,overall,pace,shooting,passing,creativity,defending,physical,goalkeeping,consistency,bigMatch,leadership,injuryResist,potential,specialTraits
Roy Keane,Manchester United,1998/99,Ireland,CM,CDM,27,90,72,75,80,78,85,88,20,88,90,95,80,90,Engine|Leader
David Beckham,Manchester United,1998/99,England,RM,CM|RW,23,88,75,80,90,88,60,70,15,85,84,75,85,90,Playmaker|Set-Piece
Thierry Henry,Arsenal,2003/04,France,ST,LW|CF,26,94,96,92,80,88,40,82,15,90,92,82,80,95,Poacher|Pace
```

Export produces the same columns so a round-trip is lossless.

---

## Seed data example (phase 2)

A seed script will insert a starter catalogue (a handful of iconic club-versions with full squads) so you can play immediately, then replace/extend everything via the admin CSV import. The three CSVs above are a valid minimal seed.

---

## Running what exists now

```bash
cd server
npm install
npx tsx test-engine.ts      # runs the engine + fixture validation demo
```

(Full server/client run + deploy instructions come with phases 2 and 6.)

---

## Decisions I made (tell me if you'd change any)

- **PlayerRating as the draftable card** (rather than one flat Player row) — this is what makes historical versions clean. If you'd rather every card be a standalone row, we can flatten it.
- **`shared.ts` duplicated into client and server** rather than an npm-workspace package — simpler to deploy to two separate platforms (Vercel + Railway).
- **Goals/game currently averages ~3.5** in mixed-quality tests; real PL is ~2.8. One constant (`BASE_GOALS`) tunes this — easy to dial in once you've seen a few simulated seasons with real data.
