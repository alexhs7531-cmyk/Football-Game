// =============================================================================
// SIMULATION ENGINE
// =============================================================================
// This is a weighted, ratings-driven model — not a random generator.
//
// For each match we:
//   1. Compute each team's four LINE STRENGTHS (GK, DEF, MID, ATT) from the
//      actual drafted players, then apply MANAGER and CHEMISTRY modifiers.
//   2. Resolve MIDFIELD BATTLE -> possession share (who controls the game).
//   3. Turn attack-vs-defence into EXPECTED GOALS (xG) using power scaling so
//      quality gaps produce meaningfully different scorelines.
//   4. Apply HOME ADVANTAGE and a BIG-MATCH swing in close, high-quality games.
//   5. SAMPLE actual goals from a Poisson distribution (seeded -> reproducible).
//   6. Attribute scorers/assists to players weighted by their attributes.
//
// All numbers come from your editable database. Change a rating and the model
// responds. No outcomes are hardcoded.
// =============================================================================

import { Rng, hashSeed } from "./rng";
import type {
  SimTeam,
  SimPlayer,
  MatchResult,
  MatchEvent,
  FixtureSpec,
} from "../types/shared";

// --- Tunable constants (kept here, not scattered) ----------------------------
const BASE_GOALS = 1.35; // league-average goals for an evenly matched side
const QUALITY_EXPONENT = 1.65; // >1 amplifies quality gaps into bigger scorelines
const HOME_ADVANTAGE = 1.12; // multiplier on home xG
const POSSESSION_INFLUENCE = 0.5; // how strongly midfield control scales output
const BIG_MATCH_THRESHOLD = 78; // both teams above this => "big match"
const OUT_OF_POSITION_PENALTY = 0.85; // chemistry hit for misused players

// Weight how each attribute feeds a line's strength. Tuned so the rich player
// data actually matters rather than just "overall".
function gkStrength(p: SimPlayer): number {
  const base = p.goalkeeping * 0.75 + p.physical * 0.1 + p.consistency * 0.15;
  return chem(p, base);
}

function defenderStrength(p: SimPlayer): number {
  const base =
    p.defending * 0.55 + p.physical * 0.25 + p.pace * 0.1 + p.consistency * 0.1;
  return chem(p, base);
}

function midfielderStrength(p: SimPlayer): {
  control: number; // contributes to possession + creation
  defend: number; // mids also help shield the defence
} {
  const control = chem(
    p,
    p.passing * 0.4 + p.creativity * 0.35 + p.consistency * 0.15 + p.physical * 0.1
  );
  const defend = chem(p, p.defending * 0.6 + p.physical * 0.3 + p.pace * 0.1);
  return { control, defend };
}

function forwardStrength(p: SimPlayer): number {
  const base =
    p.shooting * 0.45 +
    p.pace * 0.2 +
    p.creativity * 0.2 +
    p.consistency * 0.15;
  return chem(p, base);
}

// Chemistry: a player drafted out of their primary position is less effective.
function chem(p: SimPlayer, value: number): number {
  return p.inPrimaryPosition ? value : value * OUT_OF_POSITION_PENALTY;
}

interface TeamProfile {
  gk: number;
  def: number;
  midControl: number;
  midDefend: number;
  att: number;
  avgBigMatch: number;
  avgConsistency: number;
  // manager-adjusted final values
  attackOutput: number;
  defensiveResistance: number;
}

function buildProfile(team: SimTeam): TeamProfile {
  const gks = team.players.filter((p) => p.line === "GK");
  const defs = team.players.filter((p) => p.line === "DEF");
  const mids = team.players.filter((p) => p.line === "MID");
  const fwds = team.players.filter((p) => p.line === "FWD");

  const gk = avg(gks.map(gkStrength)) || 50;
  const def = avg(defs.map(defenderStrength)) || 50;
  const midParts = mids.map(midfielderStrength);
  const midControl = avg(midParts.map((m) => m.control)) || 50;
  const midDefend = avg(midParts.map((m) => m.defend)) || 50;
  const att = avg(fwds.map(forwardStrength)) || 50;

  const m = team.manager;
  // Manager style as multipliers around 1.0 (50 rating => ~neutral).
  const attackMod = 0.85 + (m.attackingStyle / 100) * 0.4 + (m.adaptability / 100) * 0.05;
  const defenceMod = 0.85 + (m.defensiveStyle / 100) * 0.4 + (m.discipline / 100) * 0.05;

  // Attack output blends forwards with midfield creation; defence blends the
  // back line, the GK and the defensive contribution of midfielders.
  const rawAttack = att * 0.62 + midControl * 0.38;
  const rawDefence = def * 0.5 + gk * 0.3 + midDefend * 0.2;

  return {
    gk,
    def,
    midControl,
    midDefend,
    att,
    avgBigMatch: avg(team.players.map((p) => p.bigMatch)) || 50,
    avgConsistency: avg(team.players.map((p) => p.consistency)) || 50,
    attackOutput: rawAttack * attackMod,
    defensiveResistance: rawDefence * defenceMod,
  };
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// --- Single match -----------------------------------------------------------

export function simulateMatch(
  home: SimTeam,
  away: SimTeam,
  seed: string
): MatchResult {
  const rng = new Rng(seed);
  const H = buildProfile(home);
  const A = buildProfile(away);

  // Midfield battle -> possession share (also influenced by manager possession).
  const hMid = H.midControl * (0.85 + home.manager.possession / 333);
  const aMid = A.midControl * (0.85 + away.manager.possession / 333);
  const homeShare = hMid / (hMid + aMid); // 0..1
  const awayShare = 1 - homeShare;

  // Possession factor: controlling the game lifts your attacking volume.
  const homePoss = 1 + (homeShare - 0.5) * 2 * POSSESSION_INFLUENCE;
  const awayPoss = 1 + (awayShare - 0.5) * 2 * POSSESSION_INFLUENCE;

  // Counter-attack lets a low-possession side stay dangerous.
  const homeCounter = 1 + (awayShare) * (home.manager.counterAttack / 100) * 0.25;
  const awayCounter = 1 + (homeShare) * (away.manager.counterAttack / 100) * 0.25;

  // Expected goals: attack vs the opponent's resistance, power-scaled.
  let homeXg =
    BASE_GOALS *
    Math.pow(H.attackOutput / A.defensiveResistance, QUALITY_EXPONENT) *
    homePoss *
    homeCounter *
    HOME_ADVANTAGE;

  let awayXg =
    BASE_GOALS *
    Math.pow(A.attackOutput / H.defensiveResistance, QUALITY_EXPONENT) *
    awayPoss *
    awayCounter;

  // Big-match swing: in close games between two strong sides, the team with
  // the higher big-match temperament gets a small edge.
  if (H.att >= BIG_MATCH_THRESHOLD && A.att >= BIG_MATCH_THRESHOLD) {
    const diff = (H.avgBigMatch - A.avgBigMatch) / 100; // -1..1
    homeXg *= 1 + diff * 0.12;
    awayXg *= 1 - diff * 0.12;
  }

  // Clamp to sane bounds.
  homeXg = clamp(homeXg, 0.15, 5.5);
  awayXg = clamp(awayXg, 0.15, 5.5);

  const homeGoals = rng.poisson(homeXg);
  const awayGoals = rng.poisson(awayXg);

  const events: MatchEvent[] = [
    ...attribute(home, homeGoals, rng),
    ...attribute(away, awayGoals, rng),
  ];

  return {
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeGoals,
    awayGoals,
    homeXg: round2(homeXg),
    awayXg: round2(awayXg),
    events,
  };
}

// Attribute each goal to a scorer (weighted by shooting/pace/creativity) and,
// most of the time, an assister (weighted by creativity/passing).
function attribute(team: SimTeam, goals: number, rng: Rng): MatchEvent[] {
  const events: MatchEvent[] = [];
  if (goals <= 0) return events;

  const attackers = team.players.filter(
    (p) => p.line === "FWD" || p.line === "MID"
  );
  const scoreWeights = attackers.map(
    (p) => p.shooting * (p.line === "FWD" ? 1.6 : 0.8) + p.pace * 0.3 + p.creativity * 0.3
  );
  const assistWeights = attackers.map(
    (p) => p.creativity * 1.4 + p.passing * 1.1
  );

  for (let g = 0; g < goals; g++) {
    const minute = rng.int(1, 90);
    const scorerIdx = rng.weightedIndex(scoreWeights);
    const scorer = attackers[scorerIdx];
    events.push({
      playerRatingId: scorer.playerRatingId,
      playerId: scorer.playerId,
      teamId: team.teamId,
      type: "GOAL",
      minute,
    });
    // ~75% of goals get an assist, from someone other than the scorer.
    if (rng.float() < 0.75 && attackers.length > 1) {
      let assistIdx = rng.weightedIndex(assistWeights);
      if (assistIdx === scorerIdx) assistIdx = (assistIdx + 1) % attackers.length;
      const assister = attackers[assistIdx];
      events.push({
        playerRatingId: assister.playerRatingId,
        playerId: assister.playerId,
        teamId: team.teamId,
        type: "ASSIST",
        minute,
      });
    }
  }
  return events;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

// --- Whole season -----------------------------------------------------------

export function simulateSeason(
  teams: SimTeam[],
  fixtures: FixtureSpec[],
  gameSeed: string
): MatchResult[] {
  const byId = new Map(teams.map((t) => [t.teamId, t]));
  return fixtures.map((f) => {
    const home = byId.get(f.homeTeamId)!;
    const away = byId.get(f.awayTeamId)!;
    // Deterministic per-fixture seed.
    const seed = `${gameSeed}:${f.matchday}:${f.homeTeamId}:${f.awayTeamId}`;
    void hashSeed(seed); // (seed string consumed by Rng)
    return simulateMatch(home, away, seed);
  });
}
