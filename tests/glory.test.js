'use strict';

/**
 * NightHawk – System of Glory
 * Unit tests (plain Node, no external test runner required).
 *
 * Run:  node tests/glory.test.js
 */

const { GlorySystem, MemoryStorage, RANKS, ACHIEVEMENTS } = require('../src/glory.js');

// ─── Tiny test runner ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅  ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${description}`);
    console.error(`       ${err.message}`);
    failed++;
  }
}

function assert(condition, msg = 'Assertion failed') {
  if (!condition) throw new Error(msg);
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertThrows(fn, msgContains) {
  let threw = false;
  try { fn(); } catch (e) {
    threw = true;
    if (msgContains && !e.message.includes(msgContains)) {
      throw new Error(`Expected error containing "${msgContains}", got: "${e.message}"`);
    }
  }
  if (!threw) throw new Error('Expected function to throw, but it did not.');
}

// Helper: create a fresh GlorySystem backed by in-memory storage.
function makeSystem() {
  return new GlorySystem(new MemoryStorage());
}

// ─── Test suites ─────────────────────────────────────────────────────────────

console.log('\n─── Player management ───────────────────────────────────────────');

test('addPlayer returns a player with correct name and zero points', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Alice');
  assertEqual(p.name, 'Alice');
  assertEqual(p.points, 0);
  assert(Array.isArray(p.achievements));
  assertEqual(p.achievements.length, 0);
  assert(typeof p.id === 'string' && p.id.length > 0);
});

test('addPlayer trims whitespace', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('  Bob  ');
  assertEqual(p.name, 'Bob');
});

test('addPlayer throws on empty string', () => {
  const gs = makeSystem();
  assertThrows(() => gs.addPlayer(''), 'non-empty string');
});

test('addPlayer throws on whitespace-only string', () => {
  const gs = makeSystem();
  assertThrows(() => gs.addPlayer('   '), 'non-empty string');
});

test('addPlayer throws on duplicate name (case-insensitive)', () => {
  const gs = makeSystem();
  gs.addPlayer('Charlie');
  assertThrows(() => gs.addPlayer('charlie'), 'already exists');
});

test('getPlayer returns correct player', () => {
  const gs = makeSystem();
  const added = gs.addPlayer('Diana');
  const fetched = gs.getPlayer(added.id);
  assertEqual(fetched.name, 'Diana');
});

test('getPlayer throws for unknown id', () => {
  const gs = makeSystem();
  assertThrows(() => gs.getPlayer('nonexistent_id'), 'not found');
});

test('getAllPlayers returns all added players', () => {
  const gs = makeSystem();
  gs.addPlayer('Eve');
  gs.addPlayer('Frank');
  assertEqual(gs.getAllPlayers().length, 2);
});

test('removePlayer removes the player', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Grace');
  gs.removePlayer(p.id);
  assertEqual(gs.getAllPlayers().length, 0);
});

test('removePlayer throws for unknown id', () => {
  const gs = makeSystem();
  assertThrows(() => gs.removePlayer('ghost'), 'not found');
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Glory points ─────────────────────────────────────────────────');

test('awardPoints increases player points', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Hank');
  const { player } = gs.awardPoints(p.id, 50);
  // Awarding 50 from 0 triggers the first_blood achievement (+10 bonus),
  // so the total is at least 50 and the player object reflects the final tally.
  assert(player.points >= 50, `Expected points >= 50, got ${player.points}`);
});

test('awardPoints throws for non-positive amount', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Ivy');
  assertThrows(() => gs.awardPoints(p.id, 0), 'positive integer');
  assertThrows(() => gs.awardPoints(p.id, -5), 'positive integer');
});

test('awardPoints throws for non-integer amount', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Jack');
  assertThrows(() => gs.awardPoints(p.id, 1.5), 'positive integer');
});

test('awardPoints throws for unknown player', () => {
  const gs = makeSystem();
  assertThrows(() => gs.awardPoints('unknown', 10), 'not found');
});

test('awardPoints returns new achievements when thresholds are crossed', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Kai');
  const { newAchievements } = gs.awardPoints(p.id, 1);
  assert(newAchievements.some(a => a.id === 'first_blood'), 'expected first_blood achievement');
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Achievements ─────────────────────────────────────────────────');

test('unlockAchievement manually grants an achievement', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Leo');
  const ach = gs.unlockAchievement(p.id, 'nighthawk');
  assert(ach !== null);
  assertEqual(ach.id, 'nighthawk');
  const updated = gs.getPlayer(p.id);
  assert(updated.achievements.includes('nighthawk'));
});

test('unlockAchievement adds bonus points', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Mia');
  const ach = ACHIEVEMENTS.find(a => a.id === 'nighthawk');
  gs.unlockAchievement(p.id, 'nighthawk');
  const updated = gs.getPlayer(p.id);
  assertEqual(updated.points, ach.points);
});

test('unlockAchievement returns null if already unlocked', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Nora');
  gs.unlockAchievement(p.id, 'nighthawk');
  const second = gs.unlockAchievement(p.id, 'nighthawk');
  assertEqual(second, null);
});

test('unlockAchievement throws for unknown achievement', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Oliver');
  assertThrows(() => gs.unlockAchievement(p.id, 'fake_ach'), 'does not exist');
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Ranks ────────────────────────────────────────────────────────');

test('getRankForPoints returns Recruit at 0 points', () => {
  const gs = makeSystem();
  assertEqual(gs.getRankForPoints(0).name, 'Recruit');
});

test('getRankForPoints returns Warrior at 100 points', () => {
  const gs = makeSystem();
  assertEqual(gs.getRankForPoints(100).name, 'Warrior');
});

test('getRankForPoints returns Glory at 10000 points', () => {
  const gs = makeSystem();
  assertEqual(gs.getRankForPoints(10000).name, 'Glory');
});

test('getRankForPoints returns Glory beyond 10000 points', () => {
  const gs = makeSystem();
  assertEqual(gs.getRankForPoints(99999).name, 'Glory');
});

test('getPlayerRank returns correct rank for a player', () => {
  const gs = makeSystem();
  const p = gs.addPlayer('Penny');
  gs.awardPoints(p.id, 500);
  // 500 base + achievement bonuses; rank should be at least Champion
  const rank = gs.getPlayerRank(p.id);
  const rankNames = RANKS.map(r => r.name);
  assert(rankNames.includes(rank.name), `Unknown rank: ${rank.name}`);
  const updatedPlayer = gs.getPlayer(p.id);
  assertEqual(rank.name, gs.getRankForPoints(updatedPlayer.points).name);
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Leaderboard ──────────────────────────────────────────────────');

test('getLeaderboard returns empty array when no players', () => {
  const gs = makeSystem();
  assertEqual(gs.getLeaderboard().length, 0);
});

test('getLeaderboard returns players sorted by points descending', () => {
  const gs = makeSystem();
  const a = gs.addPlayer('Alpha');
  const b = gs.addPlayer('Beta');
  gs.awardPoints(a.id, 200);
  gs.awardPoints(b.id, 100);
  const board = gs.getLeaderboard();
  assertEqual(board[0].name, 'Alpha');
  assertEqual(board[1].name, 'Beta');
});

test('getLeaderboard respects the limit parameter', () => {
  const gs = makeSystem();
  for (let i = 0; i < 15; i++) gs.addPlayer(`Player${i}`);
  assertEqual(gs.getLeaderboard(5).length, 5);
});

test('getLeaderboard assigns sequential rank numbers', () => {
  const gs = makeSystem();
  gs.addPlayer('X');
  gs.addPlayer('Y');
  const board = gs.getLeaderboard();
  board.forEach((e, i) => assertEqual(e.rank, i + 1));
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Events ───────────────────────────────────────────────────────');

test('on("playerAdded") fires when a player is added', () => {
  const gs = makeSystem();
  let fired = false;
  gs.on('playerAdded', () => { fired = true; });
  gs.addPlayer('Quinn');
  assert(fired, 'playerAdded event not fired');
});

test('on("playerRemoved") fires when a player is removed', () => {
  const gs = makeSystem();
  let fired = false;
  gs.on('playerRemoved', () => { fired = true; });
  const p = gs.addPlayer('Ray');
  gs.removePlayer(p.id);
  assert(fired, 'playerRemoved event not fired');
});

test('on("achievementUnlocked") fires when an achievement is unlocked', () => {
  const gs = makeSystem();
  const unlocked = [];
  gs.on('achievementUnlocked', ({ achievement }) => unlocked.push(achievement.id));
  const p = gs.addPlayer('Sam');
  gs.awardPoints(p.id, 1);
  assert(unlocked.includes('first_blood'), 'achievementUnlocked for first_blood not fired');
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Static metadata ──────────────────────────────────────────────');

test('GlorySystem.RANKS returns a copy of the ranks array', () => {
  const ranks = GlorySystem.RANKS;
  assert(Array.isArray(ranks) && ranks.length === RANKS.length);
  // Ensure mutation of the returned copy does not affect the original
  ranks[0].name = 'MUTATED';
  assertEqual(GlorySystem.RANKS[0].name, RANKS[0].name);
});

test('GlorySystem.ACHIEVEMENTS returns a copy of the achievements array', () => {
  const achs = GlorySystem.ACHIEVEMENTS;
  assert(Array.isArray(achs) && achs.length === ACHIEVEMENTS.length);
});

// ─────────────────────────────────────────────────────────────────────────────

console.log('\n─── Persistence ──────────────────────────────────────────────────');

test('Data persists across GlorySystem instances sharing the same storage', () => {
  const store = new MemoryStorage();
  const gs1 = new GlorySystem(store);
  const p = gs1.addPlayer('Tara');
  gs1.awardPoints(p.id, 75);

  const gs2 = new GlorySystem(store);
  const loaded = gs2.getPlayer(p.id);
  // Points may include achievement bonuses, so just verify they're >= 75
  assert(loaded.points >= 75, `Expected points >= 75, got ${loaded.points}`);
  assertEqual(loaded.name, 'Tara');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(60));

if (failed > 0) process.exit(1);
