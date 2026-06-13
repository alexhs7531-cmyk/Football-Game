// =============================================================================
// FIXTURE GENERATION — double round robin (Premier League style)
// 20 teams -> 38 matchdays -> each team plays every other twice (home & away).
// Uses the circle method, then mirrors the first half to create the reverse
// fixtures with home/away swapped.
// =============================================================================

import type { FixtureSpec } from "../types/shared";
import { Rng } from "./rng";

export function generateFixtures(teamIds: string[], seed: string): FixtureSpec[] {
  if (teamIds.length % 2 !== 0) {
    throw new Error(`Need an even number of teams, got ${teamIds.length}`);
  }

  // Shuffle deterministically so each game's calendar differs but is reproducible.
  const rng = new Rng(seed);
  const teams = [...teamIds];
  for (let i = teams.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }

  const n = teams.length;
  const rounds = n - 1; // 19 for 20 teams
  const half = n / 2;

  // Circle method: fix teams[0], rotate the rest.
  const arr = [...teams];
  const firstHalf: FixtureSpec[] = [];

  for (let round = 0; round < rounds; round++) {
    const matchday = round + 1;
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];
      // Alternate home/away by round and pairing index to balance.
      const homeFirst = (round + i) % 2 === 0;
      firstHalf.push({
        matchday,
        homeTeamId: homeFirst ? t1 : t2,
        awayTeamId: homeFirst ? t2 : t1,
      });
    }
    // Rotate all but the first element clockwise.
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  // Second half = reverse fixtures (swap home/away), matchdays 20..38.
  const secondHalf: FixtureSpec[] = firstHalf.map((f) => ({
    matchday: f.matchday + rounds,
    homeTeamId: f.awayTeamId,
    awayTeamId: f.homeTeamId,
  }));

  return [...firstHalf, ...secondHalf];
}

// Quick self-check (used in tests): every unordered pair appears exactly twice,
// once home and once away for each team.
export function validateFixtures(teamIds: string[], fixtures: FixtureSpec[]): void {
  const n = teamIds.length;
  const expectedMatches = n * (n - 1); // home+away for every ordered pair
  if (fixtures.length !== expectedMatches) {
    throw new Error(
      `Expected ${expectedMatches} fixtures, got ${fixtures.length}`
    );
  }
  const seen = new Set<string>();
  for (const f of fixtures) {
    const key = `${f.homeTeamId}>${f.awayTeamId}`;
    if (seen.has(key)) throw new Error(`Duplicate ordered fixture ${key}`);
    seen.add(key);
  }
  // Each team: exactly (n-1) home and (n-1) away.
  for (const id of teamIds) {
    const home = fixtures.filter((f) => f.homeTeamId === id).length;
    const away = fixtures.filter((f) => f.awayTeamId === id).length;
    if (home !== n - 1 || away !== n - 1) {
      throw new Error(`Team ${id} has ${home} home / ${away} away (expected ${n - 1} each)`);
    }
  }
}
