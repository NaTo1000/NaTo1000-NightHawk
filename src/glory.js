'use strict';

/**
 * NightHawk – System of Glory
 * Core glory engine: player profiles, achievements, ranks, and scoring.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const RANKS = [
  { name: 'Recruit',   minPoints:     0, color: '#9e9e9e' },
  { name: 'Warrior',   minPoints:   100, color: '#4caf50' },
  { name: 'Champion',  minPoints:   500, color: '#2196f3' },
  { name: 'Legend',    minPoints:  1500, color: '#9c27b0' },
  { name: 'Mythic',    minPoints:  4000, color: '#ff9800' },
  { name: 'Glory',     minPoints: 10000, color: '#ffd700' },
];

const ACHIEVEMENTS = [
  { id: 'first_blood',   name: 'First Blood',   description: 'Earn your first glory point.',             points:   10, icon: '🩸' },
  { id: 'century',       name: 'Century',        description: 'Reach 100 glory points.',                 points:   25, icon: '💯' },
  { id: 'unstoppable',   name: 'Unstoppable',    description: 'Reach 500 glory points.',                 points:   50, icon: '🔥' },
  { id: 'legendary',     name: 'Legendary',      description: 'Reach 1500 glory points.',                points:  100, icon: '⚡' },
  { id: 'mythic_rise',   name: 'Mythic Rise',    description: 'Reach 4000 glory points.',                points:  250, icon: '🌟' },
  { id: 'glory_ascent',  name: 'Glory Ascent',   description: 'Reach 10 000 glory points.',              points:  500, icon: '👑' },
  { id: 'hat_trick',     name: 'Hat Trick',      description: 'Unlock 3 achievements.',                  points:   30, icon: '🎩' },
  { id: 'collector',     name: 'Collector',      description: 'Unlock 5 achievements.',                  points:   75, icon: '🏆' },
  { id: 'completionist', name: 'Completionist',  description: 'Unlock every achievement.',               points:  200, icon: '🎖️' },
  { id: 'nighthawk',     name: 'NightHawk',      description: 'Earn glory in the dead of night (00:00–05:00).', points: 50, icon: '🦅' },
];

// ─── GlorySystem class ───────────────────────────────────────────────────────

class GlorySystem {
  /**
   * @param {Storage} [storage] – storage back-end (defaults to localStorage)
   */
  constructor(storage) {
    this._storage = storage || (typeof localStorage !== 'undefined' ? localStorage : new MemoryStorage());
    this._players = this._load('nighthawk_players') || {};
    this._listeners = [];
  }

  // ── Persistence helpers ──────────────────────────────────────────────────

  _load(key) {
    try {
      const raw = this._storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  _save() {
    try {
      this._storage.setItem('nighthawk_players', JSON.stringify(this._players));
    } catch (_) { /* quota exceeded – silently ignore */ }
  }

  // ── Event emitter ────────────────────────────────────────────────────────

  on(event, fn) {
    this._listeners.push({ event, fn });
    return this;
  }

  _emit(event, data) {
    this._listeners
      .filter(l => l.event === event)
      .forEach(l => l.fn(data));
  }

  // ── Player management ────────────────────────────────────────────────────

  /**
   * Add a new player.
   * @param {string} name
   * @returns {object} player
   */
  addPlayer(name) {
    if (!name || typeof name !== 'string') throw new Error('Player name must be a non-empty string.');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Player name must be a non-empty string.');
    const id = trimmed.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    if (Object.values(this._players).some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`A player named "${trimmed}" already exists.`);
    }
    const player = {
      id,
      name: trimmed,
      points: 0,
      achievements: [],
      createdAt: new Date().toISOString(),
    };
    this._players[id] = player;
    this._save();
    this._emit('playerAdded', player);
    return player;
  }

  /**
   * Remove a player by id.
   * @param {string} id
   */
  removePlayer(id) {
    if (!this._players[id]) throw new Error(`Player "${id}" not found.`);
    const player = this._players[id];
    delete this._players[id];
    this._save();
    this._emit('playerRemoved', player);
  }

  /**
   * Return a player by id.
   * @param {string} id
   * @returns {object}
   */
  getPlayer(id) {
    const player = this._players[id];
    if (!player) throw new Error(`Player "${id}" not found.`);
    return { ...player, achievements: [...player.achievements] };
  }

  /**
   * Return all players as an array.
   * @returns {object[]}
   */
  getAllPlayers() {
    return Object.values(this._players).map(p => ({ ...p, achievements: [...p.achievements] }));
  }

  // ── Glory points ─────────────────────────────────────────────────────────

  /**
   * Award glory points to a player.
   * @param {string} id
   * @param {number} amount – must be a positive integer
   * @returns {{ player: object, newAchievements: object[] }}
   */
  awardPoints(id, amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be a positive integer.');
    }
    const player = this._players[id];
    if (!player) throw new Error(`Player "${id}" not found.`);

    const previousPoints = player.points;
    player.points += amount;

    const hour = new Date().getHours();
    const newAchievements = this._checkAchievements(player, previousPoints, hour);

    this._save();
    this._emit('pointsAwarded', { player: { ...player }, amount, newAchievements });

    return { player: { ...player }, newAchievements };
  }

  // ── Achievements ─────────────────────────────────────────────────────────

  _checkAchievements(player, previousPoints, currentHour) {
    const unlocked = [];

    const unlock = (achId) => {
      if (!player.achievements.includes(achId)) {
        player.achievements.push(achId);
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          player.points += ach.points; // bonus points
        }
        unlocked.push(ach || { id: achId });
        this._emit('achievementUnlocked', { player: { ...player }, achievement: ach });
      }
    };

    // Point-threshold achievements
    if (player.points >= 1     && previousPoints < 1)     unlock('first_blood');
    if (player.points >= 100   && previousPoints < 100)   unlock('century');
    if (player.points >= 500   && previousPoints < 500)   unlock('unstoppable');
    if (player.points >= 1500  && previousPoints < 1500)  unlock('legendary');
    if (player.points >= 4000  && previousPoints < 4000)  unlock('mythic_rise');
    if (player.points >= 10000 && previousPoints < 10000) unlock('glory_ascent');

    // Night-owl achievement
    if (currentHour >= 0 && currentHour < 5) unlock('nighthawk');

    // Collection achievements (re-check after unlocking thresholds)
    const count = player.achievements.length;
    if (count >= 3) unlock('hat_trick');
    if (count >= 5) unlock('collector');
    if (player.achievements.length >= ACHIEVEMENTS.length) unlock('completionist');

    return unlocked;
  }

  /**
   * Manually unlock an achievement for a player.
   * @param {string} playerId
   * @param {string} achievementId
   * @returns {object|null} the achievement, or null if already unlocked
   */
  unlockAchievement(playerId, achievementId) {
    const player = this._players[playerId];
    if (!player) throw new Error(`Player "${playerId}" not found.`);

    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!ach) throw new Error(`Achievement "${achievementId}" does not exist.`);
    if (player.achievements.includes(achievementId)) return null;

    player.achievements.push(achievementId);
    player.points += ach.points;
    this._save();
    this._emit('achievementUnlocked', { player: { ...player }, achievement: ach });
    return ach;
  }

  // ── Ranks ────────────────────────────────────────────────────────────────

  /**
   * Return the rank for a given point total.
   * @param {number} points
   * @returns {object} rank
   */
  getRankForPoints(points) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (points >= r.minPoints) rank = r;
    }
    return { ...rank };
  }

  /**
   * Return a player's current rank.
   * @param {string} id
   * @returns {object}
   */
  getPlayerRank(id) {
    return this.getRankForPoints(this.getPlayer(id).points);
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────

  /**
   * Return the top-N players sorted by glory points (descending).
   * @param {number} [limit=10]
   * @returns {object[]}
   */
  getLeaderboard(limit = 10) {
    return this.getAllPlayers()
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((p, i) => ({ rank: i + 1, ...p, tier: this.getRankForPoints(p.points) }));
  }

  // ── Static metadata ──────────────────────────────────────────────────────

  static get RANKS() { return RANKS.map(r => ({ ...r })); }
  static get ACHIEVEMENTS() { return ACHIEVEMENTS.map(a => ({ ...a })); }
}

// ─── Fallback in-memory storage (Node / test environments) ──────────────────

class MemoryStorage {
  constructor() { this._data = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; }
  setItem(k, v) { this._data[k] = String(v); }
  removeItem(k) { delete this._data[k]; }
  clear() { this._data = {}; }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GlorySystem, MemoryStorage, RANKS, ACHIEVEMENTS };
} else {
  window.GlorySystem = GlorySystem;
  window.RANKS = RANKS;
  window.ACHIEVEMENTS = ACHIEVEMENTS;
}
