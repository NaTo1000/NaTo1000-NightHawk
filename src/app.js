'use strict';

/**
 * NightHawk – System of Glory
 * UI controller: wires the GlorySystem engine to the DOM.
 */

/* eslint-env browser */

(function () {
  // ── Initialise the glory engine ────────────────────────────────────────

  const glory = new GlorySystem(); // uses localStorage by default

  // ── DOM helpers ────────────────────────────────────────────────────────

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function showToast(title, message, type = '') {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type ? 'toast--' + type : ''}`;
    toast.innerHTML = `<div class="toast__title">${escHtml(title)}</div>
                       <div class="toast__message">${escHtml(message)}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut .4s ease forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, 4000);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rankBadge(tier) {
    return `<span class="badge" style="background:${escHtml(tier.color)}22;color:${escHtml(tier.color)};border:1px solid ${escHtml(tier.color)}66">${escHtml(tier.name)}</span>`;
  }

  // ── Leaderboard ────────────────────────────────────────────────────────

  function renderLeaderboard() {
    const list = $('#leaderboard-list');
    const entries = glory.getLeaderboard(10);

    if (entries.length === 0) {
      list.innerHTML = `<li class="empty"><div class="empty__icon">🏆</div>No players yet. Add someone!</li>`;
      return;
    }

    list.innerHTML = entries.map(e => {
      const rankClass = e.rank <= 3 ? ` leaderboard__rank--${e.rank}` : '';
      const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank;
      return `<li class="leaderboard__item" data-id="${escHtml(e.id)}">
        <span class="leaderboard__rank${rankClass}">${medal}</span>
        <span class="leaderboard__name">${escHtml(e.name)}</span>
        <span class="leaderboard__points">${e.points.toLocaleString()} pts</span>
        ${rankBadge(e.tier)}
      </li>`;
    }).join('');
  }

  // ── Player list (management panel) ────────────────────────────────────

  function renderPlayerList() {
    const list = $('#player-list');
    const playerSelect = $('#player-select');
    const players = glory.getAllPlayers();

    // Side list
    if (players.length === 0) {
      list.innerHTML = `<li class="empty"><div class="empty__icon">👤</div>No players yet.</li>`;
    } else {
      list.innerHTML = players.map(p => {
        const tier = glory.getRankForPoints(p.points);
        return `<li class="player-item">
          <span class="player-item__name">${escHtml(p.name)}</span>
          <span class="player-item__points">${p.points.toLocaleString()} pts</span>
          ${rankBadge(tier)}
          <button class="btn btn--danger" data-remove="${escHtml(p.id)}" style="padding:.3rem .6rem;font-size:.75rem">✕</button>
        </li>`;
      }).join('');
    }

    // Award-points selector
    const current = playerSelect.value;
    playerSelect.innerHTML = players.length
      ? players.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.name)}</option>`).join('')
      : '<option value="">— no players —</option>';
    if (current && players.some(p => p.id === current)) playerSelect.value = current;

    renderAchievements();
  }

  // ── Achievements panel ─────────────────────────────────────────────────

  function renderAchievements() {
    const playerSelect = $('#player-select');
    const grid = $('#ach-grid');
    const allAch = GlorySystem.ACHIEVEMENTS;
    const playerId = playerSelect.value;

    if (!playerId) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty__icon">🎖️</div>Select a player to see achievements.</div>`;
      return;
    }

    let player;
    try { player = glory.getPlayer(playerId); } catch (_) { return; }

    grid.innerHTML = allAch.map(ach => {
      const unlocked = player.achievements.includes(ach.id);
      return `<div class="ach-card ${unlocked ? 'unlocked' : 'locked'}" title="${escHtml(ach.description)}">
        <div class="ach-card__icon">${ach.icon}</div>
        <div class="ach-card__name">${escHtml(ach.name)}</div>
        <div class="ach-card__pts">+${ach.points} pts</div>
      </div>`;
    }).join('');
  }

  // ── Full refresh ───────────────────────────────────────────────────────

  function refresh() {
    renderLeaderboard();
    renderPlayerList();
  }

  // ── Event: add player ──────────────────────────────────────────────────

  $('#add-player-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#player-name-input');
    const name = input.value.trim();
    if (!name) return;
    try {
      glory.addPlayer(name);
      input.value = '';
      showToast('Player added', `Welcome, ${name}!`, 'success');
      refresh();
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  });

  // ── Event: remove player ───────────────────────────────────────────────

  $('#player-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const id = btn.dataset.remove;
    try {
      const p = glory.getPlayer(id);
      glory.removePlayer(id);
      showToast('Player removed', `${p.name} has been removed.`, 'danger');
      refresh();
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  });

  // ── Event: award points ────────────────────────────────────────────────

  $('#award-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const playerId = $('#player-select').value;
    const amount   = parseInt($('#points-input').value, 10);
    if (!playerId) { showToast('Error', 'Select a player first.', 'danger'); return; }
    try {
      const { player, newAchievements } = glory.awardPoints(playerId, amount);
      showToast('Glory awarded!', `+${amount} pts → ${player.name} (${player.points.toLocaleString()} total)`);
      newAchievements.forEach(ach => {
        showToast(`${ach.icon} Achievement unlocked!`, `${ach.name}: ${ach.description}`, 'success');
      });
      refresh();
    } catch (err) {
      showToast('Error', err.message, 'danger');
    }
  });

  // ── Event: player select changes → refresh achievements ───────────────

  $('#player-select').addEventListener('change', renderAchievements);

  // ── Engine event listeners ─────────────────────────────────────────────

  glory
    .on('playerAdded',        () => refresh())
    .on('playerRemoved',      () => refresh())
    .on('achievementUnlocked',() => refresh());

  // ── Initial render ─────────────────────────────────────────────────────

  refresh();
})();
