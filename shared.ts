// =============================================================================
// Shared types — copied into both server and client so the contract is identical.
// (Kept dependency-free so it drops into either project as-is.)
// =============================================================================

export const SQUAD_STRUCTURE = {
  MANAGER: 1,
  GK: 1,
  DEF: 4,
  MID: 3,
  FWD: 3,
} as const;

export const TOTAL_TEAMS = 20;
export const TEAMS_PER_PLAYER = 10;
export const ROUNDS = 10;
export const MATCHES_PER_TEAM = 38; // double round robin, 20 teams

export type SquadSlot =
  | "MANAGER"
  | "GK"
  | "DEF1" | "DEF2" | "DEF3" | "DEF4"
  | "MID1" | "MID2" | "MID3"
  | "FWD1" | "FWD2" | "FWD3";

export const OUTFIELD_SLOTS: SquadSlot[] = [
  "GK",
  "DEF1", "DEF2", "DEF3", "DEF4",
  "MID1", "MID2", "MID3",
  "FWD1", "FWD2", "FWD3",
];

export type Line = "GK" | "DEF" | "MID" | "FWD";

export function slotLine(slot: SquadSlot): Line | "MANAGER" {
  if (slot === "MANAGER") return "MANAGER";
  if (slot === "GK") return "GK";
  if (slot.startsWith("DEF")) return "DEF";
  if (slot.startsWith("MID")) return "MID";
  return "FWD";
}

// --- Shapes the simulation engine consumes (decoupled from Prisma rows) ------

export interface SimPlayer {
  playerRatingId: string;
  playerId: string;
  name: string;
  line: Line; // which line they were drafted into
  inPrimaryPosition: boolean; // chemistry: out-of-position players are weakened
  overall: number;
  pace: number;
  shooting: number;
  passing: number;
  creativity: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  consistency: number;
  bigMatch: number;
  leadership: number;
  traits: string[];
}

export interface SimManager {
  managerRatingId: string;
  name: string;
  overall: number;
  attackingStyle: number;
  defensiveStyle: number;
  possession: number;
  counterAttack: number;
  playerDevelopment: number;
  discipline: number;
  adaptability: number;
  bigMatch: number;
}

export interface SimTeam {
  teamId: string;
  name: string;
  ownerSlot: 1 | 2;
  manager: SimManager;
  players: SimPlayer[]; // exactly 11
}

export interface MatchEvent {
  playerRatingId: string;
  playerId: string;
  teamId: string;
  type: "GOAL" | "ASSIST";
  minute: number;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  homeXg: number;
  awayXg: number;
  events: MatchEvent[];
}

export interface FixtureSpec {
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
}
