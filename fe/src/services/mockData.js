/**
 * Default Seed & Fallback Data Engine for Lebupara Thunder Club
 *
 * Ensures that if the backend API is unreachable (e.g., initial Vercel deploy
 * before cloud backend is connected, or network error), the website NEVER
 * displays a blank screen or empty tables.
 */

import playerPhotos from './playerPhotos.json';

const STORAGE_KEY = 'ltc_league_offline_data_v1';

const INITIAL_DATA = {
  league: {
    id: 1,
    name: '⚡ Lebupara Thunder Club — Premier League ⚡',
    total_matches: 10,
    season: 'Season 1 (2026)',
    created_at: new Date().toISOString(),
  },
  teams: [
    { id: 1, league_id: 1, name: 'Team Suvradip', captain_name: 'Suvradip', color: '#00e5ff' },
    { id: 2, league_id: 1, name: 'Team Arnab', captain_name: 'Arnab', color: '#76ff03' },
  ],
  players: [
    { id: 1, name: 'Suvradip', team_id: 1, jersey_number: 10, is_active: true, status_note: null, photo_url: playerPhotos['Suvradip'] || null },
    { id: 2, name: 'Nilay', team_id: 1, jersey_number: 7, is_active: true, status_note: null, photo_url: playerPhotos['Nilay'] || null },
    { id: 3, name: 'Rahul', team_id: 1, jersey_number: 9, is_active: true, status_note: null, photo_url: playerPhotos['Rahul'] || null },
    { id: 4, name: 'Sourav', team_id: 1, jersey_number: 8, is_active: true, status_note: null, photo_url: playerPhotos['Sourav'] || null },
    { id: 5, name: 'Pritam', team_id: 1, jersey_number: 4, is_active: true, status_note: null, photo_url: playerPhotos['Pritam'] || null },
    { id: 6, name: 'Amit', team_id: 1, jersey_number: 1, is_active: true, status_note: null, photo_url: playerPhotos['Amit'] || null },
    { id: 7, name: 'Mahadev', team_id: 1, jersey_number: 11, is_active: true, status_note: null, photo_url: playerPhotos['Mahadev'] || null },
    { id: 8, name: 'Jayanta', team_id: 1, jersey_number: 5, is_active: true, status_note: null, photo_url: playerPhotos['Jayanta'] || null },

    { id: 9, name: 'Arnab', team_id: 2, jersey_number: 10, is_active: true, status_note: null, photo_url: playerPhotos['Arnab'] || null },
    { id: 10, name: 'Subhajit', team_id: 2, jersey_number: 9, is_active: true, status_note: null, photo_url: playerPhotos['Subhajit'] || null },
    { id: 11, name: 'Dipayan', team_id: 2, jersey_number: 7, is_active: true, status_note: null, photo_url: playerPhotos['Dipayan'] || null },
    { id: 12, name: 'Raktim', team_id: 2, jersey_number: 11, is_active: true, status_note: null },
    { id: 13, name: 'Anirban', team_id: 2, jersey_number: 5, is_active: true, status_note: null },
    { id: 14, name: 'Suman', team_id: 2, jersey_number: 1, is_active: true, status_note: null },
    { id: 15, name: 'Bappa', team_id: 2, jersey_number: 6, is_active: true, status_note: null },
    { id: 16, name: 'Raj', team_id: 2, jersey_number: 8, is_active: false, status_note: 'Ankle recovery' },
  ],
  matches: [
    {
      id: 1,
      match_number: 1,
      match_date: '2026-10-18T07:00:00',
      status: 'completed',
      notes: 'Thrilling opening derby! High intensity match.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 3 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 2 },
      ],
      goal_records: [
        { id: 1, player_id: 1, player_name: 'Suvradip', team_id: 1, goals: 2, is_own_goal: false },
        { id: 2, player_id: 2, player_name: 'Nilay', team_id: 1, goals: 1, is_own_goal: false },
        { id: 3, player_id: 9, player_name: 'Arnab', team_id: 2, goals: 1, is_own_goal: false },
        { id: 4, player_id: 10, player_name: 'Subhajit', team_id: 2, goals: 1, is_own_goal: false },
      ],
    },
    {
      id: 2,
      match_number: 2,
      match_date: '2026-10-20T07:00:00',
      status: 'completed',
      notes: 'Tight tactical battle ending in a 1-1 draw.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 1 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 1 },
      ],
      goal_records: [
        { id: 5, player_id: 3, player_name: 'Rahul', team_id: 1, goals: 1, is_own_goal: false },
        { id: 6, player_id: 11, player_name: 'Dipayan', team_id: 2, goals: 1, is_own_goal: false },
      ],
    },
    {
      id: 3,
      match_number: 3,
      match_date: '2026-10-22T07:00:00',
      status: 'completed',
      notes: 'Comeback victory for Arnab with late goals.',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 1 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 2 },
      ],
      goal_records: [
        { id: 7, player_id: 1, player_name: 'Suvradip', team_id: 1, goals: 1, is_own_goal: false },
        { id: 8, player_id: 9, player_name: 'Arnab', team_id: 2, goals: 2, is_own_goal: false },
      ],
    },
    {
      id: 4,
      match_number: 4,
      match_date: '2026-10-25T07:30:00',
      status: 'scheduled',
      notes: 'Clash of the Titans Part 4',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 5,
      match_number: 5,
      match_date: '2026-10-27T07:00:00',
      status: 'scheduled',
      notes: 'Mid-season showcase fixture',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 6,
      match_number: 6,
      match_date: '2026-10-29T07:00:00',
      status: 'scheduled',
      notes: 'Second-half opener',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 7,
      match_number: 7,
      match_date: '2026-10-31T07:00:00',
      status: 'scheduled',
      notes: 'Weekend evening showdown',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 8,
      match_number: 8,
      match_date: '2026-11-02T07:00:00',
      status: 'scheduled',
      notes: 'High-stakes title race',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 9,
      match_number: 9,
      match_date: '2026-11-04T07:00:00',
      status: 'scheduled',
      notes: 'Penultimate derby match',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
    {
      id: 10,
      match_number: 10,
      match_date: '2026-11-06T07:00:00',
      status: 'scheduled',
      notes: 'Grand League Finale!',
      team_results: [
        { team_id: 1, team_name: 'Team Suvradip', goals_scored: 0 },
        { team_id: 2, team_name: 'Team Arnab', goals_scored: 0 },
      ],
      goal_records: [],
    },
  ],
};

function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    const store = JSON.parse(raw);
    let updated = false;
    if (Array.isArray(store.players)) {
      store.players.forEach((p) => {
        if (!p.photo_url && playerPhotos[p.name]) {
          p.photo_url = playerPhotos[p.name];
          updated = true;
        }
      });
    }
    if (updated) {
      saveLocalStore(store);
    }
    return store;
  } catch {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveLocalStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function getMockLeague() {
  const store = getLocalStore();
  return { data: store.league };
}

export function getMockTeams() {
  const store = getLocalStore();
  return { data: store.teams };
}

export function getMockPlayers() {
  const store = getLocalStore();
  return { data: store.players };
}

export function getMockMatches() {
  const store = getLocalStore();
  return { data: store.matches };
}

export function getMockStandings() {
  const store = getLocalStore();
  const completed = store.matches.filter((m) => m.status === 'completed');

  const stats = {
    1: { position: 1, team_id: 1, team_name: store.teams[0].name, captain_name: store.teams[0].captain_name, color: store.teams[0].color, mp: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0 },
    2: { position: 2, team_id: 2, team_name: store.teams[1].name, captain_name: store.teams[1].captain_name, color: store.teams[1].color, mp: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0 },
  };

  completed.forEach((m) => {
    const r1 = m.team_results?.[0];
    const r2 = m.team_results?.[1];
    if (!r1 || !r2) return;

    const s1 = r1.goals_scored;
    const s2 = r2.goals_scored;

    stats[1].mp += 1;
    stats[2].mp += 1;
    stats[1].gs += s1;
    stats[1].gc += s2;
    stats[2].gs += s2;
    stats[2].gc += s1;

    if (s1 > s2) {
      stats[1].w += 1;
      stats[1].pts += 3;
      stats[2].l += 1;
    } else if (s2 > s1) {
      stats[2].w += 1;
      stats[2].pts += 3;
      stats[1].l += 1;
    } else {
      stats[1].d += 1;
      stats[1].pts += 1;
      stats[2].d += 1;
      stats[2].pts += 1;
    }
  });

  stats[1].gd = stats[1].gs - stats[1].gc;
  stats[2].gd = stats[2].gs - stats[2].gc;

  const list = Object.values(stats).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gs - a.gs);
  list.forEach((t, i) => { t.position = i + 1; });
  return { data: list };
}

export function getMockTopScorers() {
  const store = getLocalStore();
  const goalsCount = {};

  store.players.forEach((p) => {
    goalsCount[p.id] = {
      player_id: p.id,
      player_name: p.name,
      photo_url: p.photo_url || null,
      team_id: p.team_id,
      team_name: p.team_id === 1 ? store.teams[0].name : store.teams[1].name,
      captain_name: p.team_id === 1 ? store.teams[0].captain_name : store.teams[1].captain_name,
      team_color: p.team_id === 1 ? store.teams[0].color : store.teams[1].color,
      total_goals: 0,
      rank: 1,
      matches_played: 0,
    };
  });

  store.matches
    .filter((m) => m.status === 'completed')
    .forEach((m) => {
      m.goal_records?.forEach((gr) => {
        if (!gr.is_own_goal && goalsCount[gr.player_id]) {
          goalsCount[gr.player_id].total_goals += gr.goals;
        }
      });
    });

  const sorted = Object.values(goalsCount).sort((a, b) => b.total_goals - a.total_goals || a.player_name.localeCompare(b.player_name));

  let currentRank = 1;
  sorted.forEach((sc, i) => {
    if (i > 0 && sc.total_goals === sorted[i - 1].total_goals) {
      sc.rank = sorted[i - 1].rank;
    } else {
      sc.rank = currentRank;
    }
    currentRank++;
  });

  return { data: sorted };
}

export function getMockDashboardStats() {
  const store = getLocalStore();
  const standings = getMockStandings().data;
  const topScorers = getMockTopScorers().data;
  const completed = store.matches.filter((m) => m.status === 'completed').length;
  const scheduled = store.matches.filter((m) => m.status === 'scheduled').length;
  const totalGoals = store.matches
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + (m.team_results?.[0]?.goals_scored || 0) + (m.team_results?.[1]?.goals_scored || 0), 0);

  return {
    data: {
      total_matches: store.league.total_matches,
      completed_matches: completed,
      scheduled_matches: scheduled,
      postponed_matches: store.matches.filter((m) => m.status === 'postponed').length,
      total_goals: totalGoals,
      standings,
      top_scorers: topScorers,
      completion_percentage: (completed / store.league.total_matches) * 100,
      league: store.league,
    },
  };
}

export function mockLogin(username, password) {
  if (username === 'admin' && (password === 'Admin@123' || password === 'Admin@123456')) {
    return {
      data: {
        access_token: 'demo-admin-token-' + Date.now(),
        refresh_token: 'demo-refresh-token-' + Date.now(),
        token_type: 'bearer',
      },
    };
  }
  const err = new Error('Invalid credentials');
  err.response = { data: { detail: 'Invalid username or password. Default is admin / Admin@123' } };
  throw err;
}

export function getMockMe() {
  return {
    data: {
      id: 1,
      username: 'admin',
      email: 'admin@lebupara.club',
      role: 'admin',
      is_active: true,
    },
  };
}

export function mockResetSeason() {
  const store = getLocalStore();
  const total = store.league.total_matches || store.matches.length || 10;

  store.matches.forEach((m) => {
    m.status = 'scheduled';
    m.completed_at = null;
    m.team_results = [
      { team_id: store.teams[0]?.id || 1, team_name: store.teams[0]?.name || 'Team Suvradip', goals_scored: 0 },
      { team_id: store.teams[1]?.id || 2, team_name: store.teams[1]?.name || 'Team Arnab', goals_scored: 0 },
    ];
    m.goal_records = [];
  });

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'RESET_SEASON',
    resource_type: 'league',
    resource_id: store.league.id,
    after_value: JSON.stringify({ status: 'reset_to_scheduled', matches_count: store.matches.length }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return {
    data: {
      message: `League season reset successfully. All ${total} fixtures are now scheduled for the new season!`,
    },
  };
}

export function mockUpdateLeague(data = {}) {
  const store = getLocalStore();

  if (data.name !== undefined && data.name.trim()) {
    store.league.name = data.name.trim();
  }
  if (data.season !== undefined) {
    store.league.season = data.season.trim() || null;
  }

  if (data.total_matches !== undefined) {
    const newTotal = parseInt(data.total_matches, 10);
    const existingCount = store.matches.length;

    if (newTotal > existingCount) {
      const maxId = store.matches.reduce((max, m) => Math.max(max, m.id || 0), 0);
      for (let num = existingCount + 1; num <= newTotal; num++) {
        store.matches.push({
          id: maxId + (num - existingCount),
          match_number: num,
          match_date: null,
          status: 'scheduled',
          notes: `Match #${num}`,
          team_results: [
            { team_id: store.teams[0]?.id || 1, team_name: store.teams[0]?.name || 'Team Suvradip', goals_scored: 0 },
            { team_id: store.teams[1]?.id || 2, team_name: store.teams[1]?.name || 'Team Arnab', goals_scored: 0 },
          ],
          goal_records: [],
        });
      }
    } else if (newTotal < existingCount) {
      const excess = store.matches.filter((m) => m.match_number > newTotal);
      const completedExcess = excess.filter((m) => m.status === 'completed');
      if (completedExcess.length > 0) {
        const nums = completedExcess.map((m) => `#${m.match_number}`).join(', ');
        const err = new Error(`Cannot reduce total matches to ${newTotal}: Match ${nums} already completed. Reopen or delete results first.`);
        err.response = { data: { detail: err.message } };
        throw err;
      }
      store.matches = store.matches.filter((m) => m.match_number <= newTotal);
    }
    store.league.total_matches = newTotal;
  }

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'UPDATE_LEAGUE',
    resource_type: 'league',
    resource_id: store.league.id,
    after_value: JSON.stringify({ total_matches: store.league.total_matches, name: store.league.name }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: store.league };
}

export function mockAddNextMatch() {
  const store = getLocalStore();
  const maxNum = store.matches.reduce((max, m) => Math.max(max, m.match_number || 0), 0);
  const maxId = store.matches.reduce((max, m) => Math.max(max, m.id || 0), 0);
  const nextNum = maxNum + 1;

  const newMatch = {
    id: maxId + 1,
    match_number: nextNum,
    match_date: null,
    status: 'scheduled',
    notes: `Match #${nextNum}`,
    team_results: [
      { team_id: store.teams[0]?.id || 1, team_name: store.teams[0]?.name || 'Team Suvradip', goals_scored: 0 },
      { team_id: store.teams[1]?.id || 2, team_name: store.teams[1]?.name || 'Team Arnab', goals_scored: 0 },
    ],
    goal_records: [],
  };

  store.matches.push(newMatch);
  if (nextNum > (store.league.total_matches || 0)) {
    store.league.total_matches = nextNum;
  }

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'ADD_MATCH',
    resource_type: 'match',
    resource_id: newMatch.id,
    after_value: JSON.stringify({ match_number: nextNum }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: newMatch };
}

export function mockDeleteMatch(id) {
  const store = getLocalStore();
  const matchIndex = store.matches.findIndex((m) => m.id === Number(id));
  if (matchIndex === -1) {
    const err = new Error('Match not found');
    err.response = { data: { detail: 'Match not found' } };
    throw err;
  }
  const match = store.matches[matchIndex];
  if (match.status === 'completed') {
    const err = new Error('Cannot delete a completed match. Reopen it back to scheduled first.');
    err.response = { data: { detail: err.message } };
    throw err;
  }

  store.matches.splice(matchIndex, 1);
  if (store.league.total_matches > store.matches.length) {
    store.league.total_matches = store.matches.length;
  }

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'DELETE_MATCH',
    resource_type: 'match',
    resource_id: Number(id),
    after_value: JSON.stringify({ match_number: match.match_number }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: { message: `Match #${match.match_number} deleted successfully.` } };
}

export function mockUpdateMatch(id, data = {}) {
  const store = getLocalStore();
  const match = store.matches.find((m) => m.id === Number(id));
  if (!match) {
    const err = new Error('Match not found');
    err.response = { data: { detail: 'Match not found' } };
    throw err;
  }

  if (data.match_date !== undefined) match.match_date = data.match_date || null;
  if (data.notes !== undefined) match.notes = data.notes ? data.notes.trim() : null;
  if (data.status !== undefined) match.status = data.status;

  saveLocalStore(store);
  return { data: match };
}

export function mockCompleteMatch(id, data = {}) {
  const store = getLocalStore();
  const match = store.matches.find((m) => m.id === Number(id));
  if (!match) {
    const err = new Error('Match not found');
    err.response = { data: { detail: 'Match not found' } };
    throw err;
  }

  match.status = 'completed';
  match.completed_at = new Date().toISOString();
  if (data.match_date !== undefined) match.match_date = data.match_date || null;
  if (data.notes !== undefined) match.notes = data.notes ? data.notes.trim() : null;

  const t1 = store.teams.find((t) => t.id === Number(data.team1_id)) || store.teams[0];
  const t2 = store.teams.find((t) => t.id === Number(data.team2_id)) || store.teams[1];

  match.team_results = [
    { team_id: t1.id, team_name: t1.name, goals_scored: Number(data.team1_goals || 0) },
    { team_id: t2.id, team_name: t2.name, goals_scored: Number(data.team2_goals || 0) },
  ];

  match.goal_records = (data.goal_records || []).map((gr, idx) => {
    const player = store.players.find((p) => p.id === Number(gr.player_id));
    return {
      id: Date.now() + idx,
      match_id: match.id,
      player_id: Number(gr.player_id),
      player_name: player?.name || 'Player',
      team_id: Number(gr.team_id),
      goals: Number(gr.goals || 1),
      is_own_goal: Boolean(gr.is_own_goal),
    };
  });

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'COMPLETE_MATCH',
    resource_type: 'match',
    resource_id: match.id,
    after_value: JSON.stringify({ score: `${data.team1_goals}-${data.team2_goals}`, match_number: match.match_number }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: match };
}

export function mockSaveResult(id, data) {
  return mockCompleteMatch(id, data);
}

export function mockReopenMatch(id) {
  const store = getLocalStore();
  const match = store.matches.find((m) => m.id === Number(id));
  if (!match) {
    const err = new Error('Match not found');
    err.response = { data: { detail: 'Match not found' } };
    throw err;
  }
  if (match.status === 'scheduled') {
    const err = new Error('Match is already scheduled');
    err.response = { data: { detail: 'Match is already scheduled' } };
    throw err;
  }

  match.status = 'scheduled';
  match.completed_at = null;
  match.team_results = [
    { team_id: store.teams[0]?.id || 1, team_name: store.teams[0]?.name || 'Team Suvradip', goals_scored: 0 },
    { team_id: store.teams[1]?.id || 2, team_name: store.teams[1]?.name || 'Team Arnab', goals_scored: 0 },
  ];
  match.goal_records = [];

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'REOPEN_MATCH',
    resource_type: 'match',
    resource_id: match.id,
    after_value: JSON.stringify({ status: 'scheduled' }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: match };
}

export function mockPostponeMatch(id) {
  const store = getLocalStore();
  const match = store.matches.find((m) => m.id === Number(id));
  if (!match) {
    const err = new Error('Match not found');
    err.response = { data: { detail: 'Match not found' } };
    throw err;
  }

  match.status = 'postponed';

  if (!store.auditLogs) store.auditLogs = [];
  store.auditLogs.unshift({
    id: Date.now(),
    username: 'admin',
    action: 'POSTPONE_MATCH',
    resource_type: 'match',
    resource_id: match.id,
    after_value: JSON.stringify({ status: 'postponed' }),
    created_at: new Date().toISOString(),
  });

  saveLocalStore(store);
  return { data: match };
}

export function mockUpdateTeam(id, data = {}) {
  const store = getLocalStore();
  const team = store.teams.find((t) => t.id === Number(id));
  if (!team) {
    const err = new Error('Team not found');
    err.response = { data: { detail: 'Team not found' } };
    throw err;
  }

  const oldName = team.name;
  if (data.name !== undefined) team.name = data.name.trim();
  if (data.captain_name !== undefined) team.captain_name = data.captain_name.trim();
  if (data.color !== undefined) team.color = data.color.trim();

  // Propagate updated team name to matches
  store.matches.forEach((m) => {
    m.team_results?.forEach((tr) => {
      if (tr.team_id === team.id || tr.team_name === oldName) {
        tr.team_name = team.name;
      }
    });
  });

  saveLocalStore(store);
  return { data: team };
}

export function mockCreateTeam(data = {}) {
  const store = getLocalStore();
  const maxId = store.teams.reduce((max, t) => Math.max(max, t.id || 0), 0);
  const newTeam = {
    id: maxId + 1,
    league_id: store.league.id || 1,
    name: data.name?.trim() || `Team ${maxId + 1}`,
    captain_name: data.captain_name?.trim() || 'Captain',
    color: data.color || '#00e5ff',
  };
  store.teams.push(newTeam);
  saveLocalStore(store);
  return { data: newTeam };
}

export function mockCreatePlayer(data = {}) {
  const store = getLocalStore();
  const maxId = store.players.reduce((max, p) => Math.max(max, p.id || 0), 0);
  const newPlayer = {
    id: maxId + 1,
    name: data.name?.trim() || 'Player',
    team_id: data.team_id ? Number(data.team_id) : (store.teams[0]?.id || 1),
    jersey_number: data.jersey_number ? Number(data.jersey_number) : (store.players.length + 1),
    is_active: data.is_active ?? true,
    status_note: data.status_note?.trim() || null,
    photo_url: data.photo_url || null,
  };
  store.players.push(newPlayer);
  saveLocalStore(store);
  return { data: newPlayer };
}

export function mockUpdatePlayer(id, data = {}) {
  const store = getLocalStore();
  const player = store.players.find((p) => p.id === Number(id));
  if (!player) {
    const err = new Error('Player not found');
    err.response = { data: { detail: 'Player not found' } };
    throw err;
  }

  if (data.name !== undefined) player.name = data.name.trim();
  if (data.team_id !== undefined) player.team_id = Number(data.team_id);
  if (data.jersey_number !== undefined) player.jersey_number = Number(data.jersey_number);
  if (data.is_active !== undefined) player.is_active = Boolean(data.is_active);
  if (data.status_note !== undefined) player.status_note = data.status_note ? data.status_note.trim() : null;
  if (data.photo_url !== undefined) player.photo_url = data.photo_url || null;

  saveLocalStore(store);
  return { data: player };
}

export function mockGetAuditLogs() {
  const store = getLocalStore();
  return { data: store.auditLogs || [] };
}
