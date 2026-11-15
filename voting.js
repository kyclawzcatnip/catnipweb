/**
 * ==============================================================================
 * CATNIP STUDIOS — COMMUNITY VOTING MODULE (voting.js)
 * ==============================================================================
 * 
 * Fully modular community voting system connected to Supabase:
 * - Persistent voter identity using Supabase Auth (anonymous + password support)
 * - Single vote per visitor per round with vote switching capability
 * - Realtime live leaderboard with ranking, vote counts, and percentage bars
 * - Complete Admin Dashboard for users with profiles.is_admin = true
 * - Historical voting round preservation and archive viewer
 * - Client & Database-side validation with zero hardcoded vote counts
 */

(function(window) {
  'use strict';

  // Module state
  let supabase = null;
  let isInitialized = false;
  let isInitializing = false;
  let currentRound = null;
  let allGames = [];
  let currentVotes = [];
  let userVote = null;
  let currentUser = null;
  let currentProfile = null;
  let realtimeChannel = null;
  let roundHistory = [];
  let selectedArchiveRound = null;

  // Supabase Configuration Resolver
  function getConfig() {
    let url = '';
    let anonKey = '';

    // 1. window.ENV (from env.js)
    if (window.ENV && window.ENV.SUPABASE_URL) url = window.ENV.SUPABASE_URL;
    if (window.ENV && window.ENV.SUPABASE_ANON_KEY) anonKey = window.ENV.SUPABASE_ANON_KEY;

    // 2. Direct window globals
    if (!url && window.SUPABASE_URL) url = window.SUPABASE_URL;
    if (!anonKey && window.SUPABASE_ANON_KEY) anonKey = window.SUPABASE_ANON_KEY;

    // 3. Process env if bundled
    if (!url && typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) {
      url = process.env.SUPABASE_URL;
    }
    if (!anonKey && typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) {
      anonKey = process.env.SUPABASE_ANON_KEY;
    }

    // 4. LocalStorage overrides
    const localUrl = localStorage.getItem('CATNIP_SUPABASE_URL');
    const localKey = localStorage.getItem('CATNIP_SUPABASE_ANON_KEY');
    if (localUrl) url = localUrl;
    if (localKey) anonKey = localKey;

    return {
      url: (url || '').trim(),
      anonKey: (anonKey || '').trim(),
      isConfigured: !!(url && anonKey && !url.includes('your-project-id'))
    };
  }

  // Toast Notification Helper
  function showToast(message, type = 'info') {
    if (typeof window.showHackerNotification === 'function') {
      window.showHackerNotification(message);
      return;
    }

    let toastContainer = document.getElementById('voting-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'voting-toast-container';
      toastContainer.className = 'voting-toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `voting-toast toast-${type}`;
    toast.innerHTML = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Audio helper
  function playSound(type) {
    if (typeof window.playRetroSound === 'function') {
      window.playRetroSound(type);
    }
  }

  // Initialize Supabase Client & Auth
  async function initClient() {
    const config = getConfig();

    if (!config.isConfigured) {
      renderSetupBanner(false);
      return false;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.error('[Catnip Voting] Supabase JS Client library is not loaded in window.supabase.');
      renderSetupBanner(false, 'Supabase client library missing from page.');
      return false;
    }

    try {
      supabase = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      // 1. Establish persistent voter identity
      await ensureAuthSession();

      // 2. Fetch voter profile (check admin status)
      await fetchUserProfile();

      return true;
    } catch (err) {
      console.error('[Catnip Voting] Error initializing Supabase client:', err);
      renderSetupBanner(false, `Connection initialization error: ${err.message}`);
      return false;
    }
  }

  // Ensure persistent voter session using Supabase Auth
  async function ensureAuthSession() {
    if (!supabase) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (session && session.user) {
        currentUser = session.user;
        return;
      }

      // No active session — create persistent anonymous voter session
      if (typeof supabase.auth.signInAnonymously === 'function') {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonData && anonData.user) {
          currentUser = anonData.user;
          return;
        }
      }

      // Fallback if anonymous auth is disabled on project: check getUser
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user || null;
    } catch (err) {
      console.warn('[Catnip Voting] Session check notice:', err);
    }
  }

  // Fetch and verify public.profiles record for current user using auth user ID
  async function fetchUserProfile() {
    currentProfile = null;
    if (!supabase || !currentUser) {
      updateAuthUI();
      return;
    }

    try {
      // Look up profile strictly by auth user ID
      // Does not rely on or require an email column in public.profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, is_admin, display_name, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        // Existing profile found (including existing admin with is_admin = true)
        // Strictly preserve and use existing permissions
        currentProfile = data;
      } else {
        // Only if NO profile row exists at all for this user ID, insert a default voter profile without email
        const isAnon = currentUser.is_anonymous || !currentUser.email;
        const defaultName = isAnon 
          ? `Feline #${currentUser.id.substring(0, 6)}` 
          : (currentUser.user_metadata?.display_name || currentUser.user_metadata?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Community Feline'));

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            display_name: defaultName,
            is_admin: false
          })
          .select('id, is_admin, display_name, avatar_url')
          .maybeSingle();

        if (insertError) {
          console.warn('[Catnip Voting] Profile insert notice:', insertError.message);
        }

        currentProfile = newProfile || { id: currentUser.id, is_admin: false, display_name: defaultName };
      }
    } catch (err) {
      console.warn('[Catnip Voting] Profile fetch notice:', err);
      currentProfile = { id: currentUser.id, is_admin: false, display_name: 'Community Feline' };
    }

    updateAuthUI();
  }

  // Setup Realtime Subscriptions for live updates
  function setupRealtime() {
    if (!supabase) return;

    if (realtimeChannel) {
      try { supabase.removeChannel(realtimeChannel); } catch (e) {}
      realtimeChannel = null;
    }

    try {
      realtimeChannel = supabase
        .channel('catnip-voting-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
          refreshData({ silent: true });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_rounds' }, () => {
          refreshData({ silent: true });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
          refreshData({ silent: true });
        })
        .subscribe();
    } catch (err) {
      console.warn('[Catnip Voting] Realtime subscription warning:', err);
    }
  }

  // Refresh all voting data from database
  async function refreshData(options = {}) {
    if (!supabase) return;
    const { silent = false } = options;

    if (!silent) {
      setLoadingState(true);
    }

    try {
      // 1. Fetch current active or latest round
      const { data: rounds, error: roundError } = await supabase
        .from('voting_rounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (roundError) throw roundError;

      roundHistory = rounds || [];
      // Pick active open round, or the latest round if none open
      currentRound = roundHistory.find(r => r.status === 'open' && r.is_active) || roundHistory[0] || null;

      // 2. Fetch candidate games for this round or available games
      let gamesQuery = supabase.from('games').select('*').order('name', { ascending: true });
      if (currentRound) {
        // Fetch games matching this round or global games
        gamesQuery = gamesQuery.or(`round_id.eq.${currentRound.id},round_id.is.null`);
      }
      const { data: games, error: gamesError } = await gamesQuery;
      if (gamesError) throw gamesError;
      allGames = games || [];

      // 3. Fetch votes for the current round
      if (currentRound) {
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('id, user_id, game_id, round_id, created_at')
          .eq('round_id', currentRound.id);

        if (votesError) throw votesError;
        currentVotes = votes || [];

        // Check current user's vote
        if (currentUser) {
          userVote = currentVotes.find(v => v.user_id === currentUser.id) || null;
        } else {
          userVote = null;
        }
      } else {
        currentVotes = [];
        userVote = null;
      }

      // Render UI components
      renderVotingInterface();
      renderAdminDashboard();
    } catch (err) {
      console.error('[Catnip Voting] Failed to refresh voting data:', err);
      showToast(`Error syncing voting data: ${err.message}`, 'error');
    } finally {
      if (!silent) {
        setLoadingState(false);
      }
    }
  }

  // Cast or change vote for a game
  async function voteForGame(gameId) {
    if (!supabase) {
      showToast('⚠️ Supabase connection is not configured.', 'warning');
      return;
    }

    if (!currentRound || currentRound.status !== 'open') {
      showToast('🔒 Voting is currently closed for this round.', 'warning');
      return;
    }

    const targetGame = allGames.find(g => g.id === gameId);
    if (!targetGame || !targetGame.is_available) {
      showToast('⚠️ This candidate game is currently unavailable for voting.', 'warning');
      return;
    }

    // Ensure session
    await ensureAuthSession();
    if (!currentUser) {
      showToast('🔒 Unable to verify voter identity. Please sign in to vote.', 'warning');
      return;
    }

    // Prevent re-voting for the same game
    if (userVote && userVote.game_id === gameId) {
      showToast(`⭐ You have already voted for "${targetGame.name}".`, 'info');
      return;
    }

    const isVoteSwitch = !!userVote;
    const previousGame = isVoteSwitch ? allGames.find(g => g.id === userVote.game_id) : null;

    // Optimistic UI feedback
    setButtonLoading(gameId, true);
    playSound('click');

    try {
      // 1. Try secure RPC cast_vote
      let rpcSuccess = false;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('cast_vote', {
          p_game_id: gameId,
          p_round_id: currentRound.id
        });

        if (!rpcError && rpcData && rpcData.success) {
          rpcSuccess = true;
        } else if (rpcError) {
          console.warn('[Catnip Voting] RPC cast_vote fallback to table upsert:', rpcError.message);
        }
      } catch (e) {
        console.warn('[Catnip Voting] RPC attempt error:', e);
      }

      // 2. Direct table upsert fallback (if RPC is not yet applied in DB)
      if (!rpcSuccess) {
        const { error: upsertError } = await supabase
          .from('votes')
          .upsert({
            user_id: currentUser.id,
            round_id: currentRound.id,
            game_id: gameId,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,round_id'
          });

        if (upsertError) throw upsertError;
      }

      playSound('coin');
      if (isVoteSwitch) {
        showToast(`🔄 Vote switched from <strong>${previousGame ? previousGame.name : 'previous game'}</strong> to <strong>${targetGame.name}</strong>!`, 'success');
      } else {
        showToast(`🎉 Vote successfully cast for <strong>${targetGame.name}</strong>!`, 'success');
      }

      // Refresh data
      await refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Vote submission failed:', err);
      showToast(`❌ Failed to submit vote: ${err.message}`, 'error');
    } finally {
      setButtonLoading(gameId, false);
    }
  }

  // Compute live ranking, counts, and percentages
  function calculateLeaderboard() {
    const totalVotes = currentVotes.length;
    const countsByGame = {};

    // Initialize counts for all games
    allGames.forEach(g => {
      countsByGame[g.id] = 0;
    });

    // Tally votes
    currentVotes.forEach(v => {
      if (countsByGame[v.game_id] !== undefined) {
        countsByGame[v.game_id]++;
      }
    });

    // Map into ranked array
    const ranked = allGames.map(game => {
      const votes = countsByGame[game.id] || 0;
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
      return {
        ...game,
        votes,
        percentage: parseFloat(percentage),
        percentageStr: `${percentage}%`
      };
    });

    // Sort descending by vote count, then alphabetically
    ranked.sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.name.localeCompare(b.name);
    });

    // Assign ranking numbers
    ranked.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      totalVotes,
      ranked,
      leader: ranked.length > 0 && ranked[0].votes > 0 ? ranked[0] : null
    };
  }

  // Render the primary voting interface
  function renderVotingInterface() {
    const statsContainer = document.getElementById('voting-header-stats');
    const roundBanner = document.getElementById('voting-round-banner');
    const leaderboardGrid = document.getElementById('voting-leaderboard-grid');
    const candidatesGrid = document.getElementById('voting-candidates-grid');
    const winnerDisplay = document.getElementById('voting-winner-showcase');

    if (!statsContainer || !candidatesGrid) return;

    // 1. Setup banner visibility
    renderSetupBanner(true);

    if (!currentRound) {
      roundBanner.innerHTML = `
        <div class="voting-empty-state">
          <div class="voting-empty-icon">🗳️</div>
          <h3>No Active Voting Round</h3>
          <p>The studio has not launched an active voting round yet. Check back soon or ask an administrator to start Round 1!</p>
          ${currentProfile && currentProfile.is_admin ? '<button class="btn btn-primary" onclick="window.CatnipVoting.openNewRoundModal()">+ Start First Voting Round</button>' : ''}
        </div>
      `;
      candidatesGrid.innerHTML = '';
      leaderboardGrid.innerHTML = '';
      winnerDisplay.style.display = 'none';
      return;
    }

    const { totalVotes, ranked, leader } = calculateLeaderboard();
    const isOpen = currentRound.status === 'open';

    // 2. Round Info & Header Status Banner
    const statusClass = isOpen ? 'badge-open' : 'badge-closed';
    const statusLabel = isOpen ? '🟢 Live & Open' : (currentRound.status === 'archived' ? '📦 Archived' : '🔴 Voting Closed');

    roundBanner.innerHTML = `
      <div class="voting-round-header">
        <div class="voting-round-info">
          <div class="voting-badge-row">
            <span class="voting-status-badge ${statusClass}">${statusLabel}</span>
            <span class="voting-round-chip">Voting Cycle</span>
          </div>
          <h2 class="voting-round-title">${escapeHtml(currentRound.title)}</h2>
          <p class="voting-round-desc">${escapeHtml(currentRound.description || 'Cast your community vote to steer upcoming Catnip Studios game development priorities!')}</p>
        </div>
        <div class="voting-metrics-cards">
          <div class="voting-metric-card">
            <span class="metric-val" id="metric-total-votes">${totalVotes}</span>
            <span class="metric-lbl">Total Votes Cast</span>
          </div>
          <div class="voting-metric-card">
            <span class="metric-val">${allGames.filter(g => g.is_available).length}</span>
            <span class="metric-lbl">Candidate Games</span>
          </div>
          <div class="voting-metric-card">
            <span class="metric-val">${userVote ? '1/1 Cast' : (isOpen ? '0/1 Voted' : 'None')}</span>
            <span class="metric-lbl">Your Vote</span>
          </div>
        </div>
      </div>
    `;

    // 3. Winner Showcase (if round is closed/completed with a declared winner)
    let winnerGame = null;
    if (currentRound.winner_game_id) {
      winnerGame = allGames.find(g => g.id === currentRound.winner_game_id);
    } else if (!isOpen && leader) {
      winnerGame = leader;
    }

    if (!isOpen && winnerGame) {
      winnerDisplay.style.display = 'block';
      winnerDisplay.innerHTML = `
        <div class="winner-showcase-card">
          <div class="winner-glow-banner">
            <div class="winner-trophy">🏆</div>
            <div class="winner-text-group">
              <span class="winner-eyebrow">COMMUNITY CHOICE WINNER</span>
              <h3 class="winner-title">${escapeHtml(winnerGame.name)}</h3>
              <p class="winner-desc">Next Development Priority for Catnip Studios Roadmap! (Received ${winnerGame.votes || 0} votes)</p>
            </div>
          </div>
          <div class="winner-notice-pill">
            <span>⚙️ Roadmap Priority: Queued for active development planning</span>
          </div>
        </div>
      `;
    } else {
      winnerDisplay.style.display = 'none';
      winnerDisplay.innerHTML = '';
    }

    // 4. Live Leaderboard Section
    if (leaderboardGrid) {
      let leaderboardHTML = `
        <div class="leaderboard-table-card">
          <div class="leaderboard-card-header">
            <div>
              <h3 class="leaderboard-heading">📊 Live Standings & Rankings</h3>
              <p class="leaderboard-subheading">Updated in real-time as community members cast and switch their votes</p>
            </div>
            <div class="leaderboard-header-badge">
              <span>${isOpen ? '⚡ Live Sync Active' : '🔒 Final Results'}</span>
            </div>
          </div>
          <div class="leaderboard-rows-wrapper">
      `;

      if (ranked.length === 0) {
        leaderboardHTML += `<div class="leaderboard-empty-text">No candidate games available yet.</div>`;
      } else {
        ranked.forEach(item => {
          const isUserVoted = userVote && userVote.game_id === item.id;
          const isLeader = item.rank === 1 && item.votes > 0;
          const medal = item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : `#${item.rank}`));

          leaderboardHTML += `
            <div class="leaderboard-row ${isUserVoted ? 'row-user-voted' : ''} ${isLeader ? 'row-leader' : ''}">
              <div class="leaderboard-rank-col">
                <span class="rank-medal">${medal}</span>
              </div>
              <div class="leaderboard-info-col">
                <div class="leaderboard-title-line">
                  <span class="game-row-name">${escapeHtml(item.name)}</span>
                  ${isLeader ? '<span class="leader-tag">Leader</span>' : ''}
                  ${isUserVoted ? '<span class="user-vote-tag">Your Vote ✓</span>' : ''}
                  <span class="game-row-votes"><strong>${item.votes}</strong> ${item.votes === 1 ? 'vote' : 'votes'} (${item.percentageStr})</span>
                </div>
                <div class="leaderboard-bar-track">
                  <div class="leaderboard-bar-fill ${isLeader ? 'fill-leader' : ''} ${isUserVoted ? 'fill-user' : ''}" style="width: ${item.percentage}%;"></div>
                </div>
              </div>
            </div>
          `;
        });
      }

      leaderboardHTML += `</div></div>`;
      leaderboardGrid.innerHTML = leaderboardHTML;
    }

    // 5. Candidate Game Cards Grid
    let cardsHTML = '';
    const availableGames = ranked.filter(g => g.is_available);

    if (availableGames.length === 0) {
      cardsHTML = `
        <div class="voting-empty-state" style="grid-column: 1 / -1;">
          <p>No active candidate games are available for this round.</p>
        </div>
      `;
    } else {
      availableGames.forEach(game => {
        const isVoted = userVote && userVote.game_id === game.id;
        const medal = game.rank === 1 ? '🥇 #1 Rank' : (game.rank === 2 ? '🥈 #2 Rank' : (game.rank === 3 ? '🥉 #3 Rank' : `#${game.rank} Rank`));

        let btnText = 'Vote for This Game';
        let btnClass = 'btn-vote-primary';
        let btnDisabled = false;

        if (!isOpen) {
          btnText = 'Voting Closed';
          btnClass = 'btn-vote-disabled';
          btnDisabled = true;
        } else if (isVoted) {
          btnText = '✓ Voted (Your Choice)';
          btnClass = 'btn-vote-active';
        } else if (userVote) {
          btnText = 'Switch Vote to This Game';
          btnClass = 'btn-vote-switch';
        }

        const fallbackImg = getPlaceholderSvg(game.name);
        const imgSrc = game.image_url ? escapeHtml(game.image_url) : fallbackImg;

        cardsHTML += `
          <div class="candidate-card ${isVoted ? 'card-voted' : ''}" id="game-card-${game.id}">
            <div class="candidate-card-media">
              <img src="${imgSrc}" alt="${escapeHtml(game.name)}" class="candidate-card-img" onerror="this.onerror=null; this.src='${fallbackImg}';" />
              <div class="candidate-rank-badge ${game.rank === 1 ? 'rank-gold' : ''}">${medal}</div>
              ${isVoted ? '<div class="candidate-voted-pill">Your Current Vote</div>' : ''}
            </div>
            <div class="candidate-card-body">
              <div class="candidate-card-header">
                <h3 class="candidate-title">${escapeHtml(game.name)}</h3>
              </div>
              <p class="candidate-desc">${escapeHtml(game.description || 'Vote for this game candidate to make it the next development priority!')}</p>
              
              <div class="candidate-stats-box">
                <div class="candidate-stats-row">
                  <span class="stats-label">Community Votes</span>
                  <span class="stats-val"><strong>${game.votes}</strong> (${game.percentageStr})</span>
                </div>
                <div class="candidate-progress-track">
                  <div class="candidate-progress-fill" style="width: ${game.percentage}%;"></div>
                </div>
              </div>

              <div class="candidate-actions">
                <button 
                  class="btn ${btnClass} btn-vote-action" 
                  id="btn-vote-${game.id}"
                  ${btnDisabled ? 'disabled' : ''}
                  onclick="window.CatnipVoting.voteForGame('${game.id}')"
                >
                  <span class="btn-vote-icon">${isVoted ? '✓' : (userVote ? '🔄' : '🗳️')}</span>
                  <span class="btn-vote-text">${btnText}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      });
    }

    candidatesGrid.innerHTML = cardsHTML;
  }

  // Render Admin Dashboard Controls
  function renderAdminDashboard() {
    const adminContainer = document.getElementById('voting-admin-container');
    if (!adminContainer) return;

    // Strict security check: only render admin controls if profiles.is_admin === true
    const isAdmin = currentProfile && currentProfile.is_admin === true;
    if (!isAdmin) {
      adminContainer.style.display = 'none';
      adminContainer.innerHTML = '';
      return;
    }

    adminContainer.style.display = 'block';
    const isOpen = currentRound && currentRound.status === 'open';

    adminContainer.innerHTML = `
      <div class="admin-dashboard-card">
        <div class="admin-card-header">
          <div class="admin-title-group">
            <span class="admin-shield-icon">🛡️</span>
            <div>
              <h3>Voting Administration & Game Controls</h3>
              <p class="admin-subtitle">Authenticated as verified Studio Admin (${escapeHtml((currentProfile && currentProfile.display_name) || (currentUser && currentUser.email) || 'Admin')})</p>
            </div>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openNewRoundModal()">
              <span>➕</span> New Voting Round
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openAddGameModal()">
              <span>🎮</span> Add Candidate Game
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.toggleRoundStatus()">
              <span>${isOpen ? '🔒' : '🔓'}</span> ${isOpen ? 'Close Voting' : 'Re-Open Voting'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openWinnerModal()">
              <span>🏆</span> Declare Winner
            </button>
          </div>
        </div>

        <div class="admin-tables-container">
          <h4 class="admin-section-heading">Manage Candidate Games (${allGames.length})</h4>
          <div class="admin-games-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Game Name</th>
                  <th>Status</th>
                  <th>Current Votes</th>
                  <th>Round</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allGames.map(game => {
                  const gameVotes = currentVotes.filter(v => v.game_id === game.id).length;
                  return `
                    <tr>
                      <td>
                        <strong>${escapeHtml(game.name)}</strong>
                        <div class="game-meta-desc">${escapeHtml((game.description || '').substring(0, 60))}...</div>
                      </td>
                      <td>
                        <span class="status-pill ${game.is_available ? 'pill-active' : 'pill-disabled'}">
                          ${game.is_available ? 'Available' : 'Disabled'}
                        </span>
                      </td>
                      <td><strong>${gameVotes}</strong> votes</td>
                      <td>${game.round_id ? (currentRound && game.round_id === currentRound.id ? 'Current Round' : 'Assigned') : 'All Rounds'}</td>
                      <td>
                        <div class="admin-action-btn-group">
                          <button class="btn-action-small" onclick="window.CatnipVoting.openEditGameModal('${game.id}')" title="Edit Game Details">✏️ Edit</button>
                          <button class="btn-action-small" onclick="window.CatnipVoting.toggleGameAvailability('${game.id}', ${!game.is_available})" title="${game.is_available ? 'Disable Game' : 'Enable Game'}">
                            ${game.is_available ? '🚫 Disable' : '✅ Enable'}
                          </button>
                          <button class="btn-action-small btn-action-danger" onclick="window.CatnipVoting.safeDeleteGame('${game.id}')" title="Safe Remove">🗑️ Remove</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // Update Voter Authentication Display Bar
  function updateAuthUI() {
    const authStatusEl = document.getElementById('voting-voter-identity-bar');
    if (!authStatusEl) return;

    if (!currentUser) {
      authStatusEl.innerHTML = `
        <div class="voter-identity-box">
          <span class="voter-badge">🔒 Guest</span>
          <span class="voter-text">Authenticating persistent voter session...</span>
          <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openAuthModal()">Sign In</button>
        </div>
      `;
      return;
    }

    const isAdmin = currentProfile && currentProfile.is_admin === true;
    const displayName = (currentProfile && currentProfile.display_name) || (currentUser.email ? currentUser.email.split('@')[0] : `Voter #${currentUser.id.substring(0, 6)}`);

    authStatusEl.innerHTML = `
      <div class="voter-identity-box">
        <span class="voter-badge ${isAdmin ? 'badge-admin' : 'badge-voter'}">
          ${isAdmin ? '👑 Admin Verified' : '🐾 Community Voter'}
        </span>
        <span class="voter-text">
          Logged in as <strong>${escapeHtml(displayName)}</strong>
          ${isAdmin ? '<span class="admin-active-label">(Admin Dashboard Active)</span>' : ''}
        </span>
        <div class="voter-actions">
          <button class="btn btn-secondary btn-xs" onclick="window.CatnipVoting.openAuthModal()">
            ${currentUser.is_anonymous ? '🔑 Admin Sign In' : 'Account'}
          </button>
          ${!currentUser.is_anonymous ? '<button class="btn btn-secondary btn-xs" onclick="window.CatnipVoting.signOut()">Sign Out</button>' : ''}
        </div>
      </div>
    `;
  }

  // Setup / Connection Banner & Config Modal
  function renderSetupBanner(isConnected, errorMsg = '') {
    const banner = document.getElementById('voting-connection-banner');
    if (!banner) return;

    if (isConnected) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="supabase-setup-alert">
        <div class="setup-alert-icon">⚡</div>
        <div class="setup-alert-content">
          <h4>Supabase Project Connection Required</h4>
          <p>The Community Voting system requires a connection to your Supabase project to cast votes, sync realtime leaderboards, and power admin controls.</p>
          ${errorMsg ? `<div class="setup-error-msg">${escapeHtml(errorMsg)}</div>` : ''}
          <div class="setup-buttons-row">
            <button class="btn btn-primary btn-sm" onclick="window.CatnipVoting.openConfigModal()">
              ⚙️ Configure Supabase Credentials
            </button>
            <a href="supabase_schema.sql" download class="btn btn-secondary btn-sm">
              📜 Download SQL Schema
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== ADMIN ACTIONS ====================

  // Toggle Round Status (Open / Close)
  async function toggleRoundStatus() {
    if (!supabase || !currentRound || !currentProfile?.is_admin) return;

    const newStatus = currentRound.status === 'open' ? 'closed' : 'open';
    const confirmMsg = newStatus === 'closed' 
      ? 'Are you sure you want to CLOSE voting for this round? Visitors will no longer be able to submit votes.' 
      : 'Re-open voting for this round?';

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('voting_rounds')
        .update({
          status: newStatus,
          is_active: newStatus === 'open',
          end_date: newStatus === 'closed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentRound.id);

      if (error) throw error;

      showToast(`Voting round is now ${newStatus.toUpperCase()}!`, 'success');
      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Toggle round status error:', err);
      showToast(`Failed to update round status: ${err.message}`, 'error');
    }
  }

  // Safe delete game (with vote preservation protection)
  async function safeDeleteGame(gameId) {
    if (!supabase || !currentProfile?.is_admin) return;

    const targetGame = allGames.find(g => g.id === gameId);
    if (!targetGame) return;

    if (!confirm(`Are you sure you want to remove candidate game "${targetGame.name}"?`)) return;

    try {
      // 1. Try safe_delete_game RPC
      let rpcHandled = false;
      try {
        const { data, error } = await supabase.rpc('safe_delete_game', { p_game_id: gameId });
        if (!error && data && data.success) {
          rpcHandled = true;
          showToast(data.message, 'info');
        }
      } catch (e) {}

      // 2. Direct check fallback
      if (!rpcHandled) {
        const { count, error: countError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('game_id', gameId);

        if (count && count > 0) {
          // Has historical votes! Protect integrity by disabling instead of deleting
          await supabase.from('games').update({ is_available: false }).eq('id', gameId);
          showToast(`Game "${targetGame.name}" has ${count} historical votes. To protect voting history, it was disabled instead of deleted.`, 'warning');
        } else {
          await supabase.from('games').delete().eq('id', gameId);
          showToast(`Game "${targetGame.name}" was safely deleted.`, 'success');
        }
      }

      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Safe delete game error:', err);
      showToast(`Failed to remove game: ${err.message}`, 'error');
    }
  }

  // Toggle Game Available status
  async function toggleGameAvailability(gameId, isAvailable) {
    if (!supabase || !currentProfile?.is_admin) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', gameId);

      if (error) throw error;

      showToast(`Game candidate status updated to ${isAvailable ? 'AVAILABLE' : 'DISABLED'}!`, 'success');
      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Update game availability error:', err);
      showToast(`Failed to update game status: ${err.message}`, 'error');
    }
  }

  // ==================== MODALS & DIALOGS ====================

  // Generic modal creator helper
  function openModal(title, bodyHtml, onConfirm = null, confirmText = 'Save') {
    closeActiveModal();

    const overlay = document.createElement('div');
    overlay.id = 'voting-active-modal';
    overlay.className = 'voting-modal-overlay';
    overlay.innerHTML = `
      <div class="voting-modal-box">
        <div class="voting-modal-header">
          <h3>${title}</h3>
          <button class="voting-modal-close" onclick="window.CatnipVoting.closeModal()">&times;</button>
        </div>
        <div class="voting-modal-body">
          ${bodyHtml}
        </div>
        <div class="voting-modal-footer">
          <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.closeModal()">Cancel</button>
          ${onConfirm ? `<button class="btn btn-primary btn-sm" id="voting-modal-confirm-btn">${confirmText}</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (onConfirm) {
      const confirmBtn = document.getElementById('voting-modal-confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', onConfirm);
      }
    }
  }

  function closeActiveModal() {
    const existing = document.getElementById('voting-active-modal');
    if (existing) existing.remove();
  }

  // Modal: Supabase Project Configuration
  function openConfigModal() {
    const config = getConfig();
    const bodyHtml = `
      <p style="margin-bottom: 12px; color: var(--color-text-secondary); font-size: 0.88rem;">
        Enter your Supabase Project URL and Public Anon Key. You can find these in your 
        <strong>Supabase Dashboard &rarr; Project Settings &rarr; API</strong>.
      </p>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">SUPABASE_URL</label>
        <input type="text" id="cfg-supabase-url" class="form-input" style="width: 100%;" placeholder="https://xyzcompany.supabase.co" value="${escapeHtml(config.url)}" />
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">SUPABASE_ANON_KEY (Public)</label>
        <textarea id="cfg-supabase-key" class="form-input" style="width: 100%; height: 80px; font-family: monospace; font-size: 0.78rem;" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">${escapeHtml(config.anonKey)}</textarea>
      </div>
      <div style="background: rgba(124, 77, 255, 0.1); border-left: 3px solid #7C4DFF; padding: 10px; border-radius: 4px; font-size: 0.78rem; color: #a39eb8;">
        🔒 <strong>Security Guarantee:</strong> Never enter your service-role secret key or database password. Only the public anon key is safe in frontend code.
      </div>
    `;

    openModal('⚙️ Supabase Project Configuration', bodyHtml, async () => {
      const urlInput = document.getElementById('cfg-supabase-url');
      const keyInput = document.getElementById('cfg-supabase-key');
      const newUrl = urlInput ? urlInput.value.trim() : '';
      const newKey = keyInput ? keyInput.value.trim() : '';

      if (!newUrl || !newKey) {
        showToast('Please provide both Supabase URL and Anon Key.', 'warning');
        return;
      }

      localStorage.setItem('CATNIP_SUPABASE_URL', newUrl);
      localStorage.setItem('CATNIP_SUPABASE_ANON_KEY', newKey);
      closeActiveModal();
      showToast('Supabase credentials saved! Connecting...', 'info');

      const success = await initClient();
      if (success) {
        setupRealtime();
        refreshData();
        showToast('Connected to Supabase successfully!', 'success');
      }
    }, 'Save & Connect');
  }

  // Modal: Add New Candidate Game
  function openAddGameModal() {
    if (!currentProfile?.is_admin) return;

    const bodyHtml = `
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Game Title</label>
        <input type="text" id="add-game-name" class="form-input" style="width: 100%;" placeholder="e.g. Catnip Dungeons" />
      </div>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Description</label>
        <textarea id="add-game-desc" class="form-input" style="width: 100%; height: 70px;" placeholder="Short synopsis of the game concept, gameplay mechanics, and physics."></textarea>
      </div>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Image / Artwork URL (Optional)</label>
        <input type="text" id="add-game-img" class="form-input" style="width: 100%;" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem;">
          <input type="checkbox" id="add-game-available" checked />
          <span>Available for voting in current round</span>
        </label>
      </div>
    `;

    openModal('🎮 Add Candidate Game', bodyHtml, async () => {
      const name = (document.getElementById('add-game-name')?.value || '').trim();
      const desc = (document.getElementById('add-game-desc')?.value || '').trim();
      const img = (document.getElementById('add-game-img')?.value || '').trim();
      const isAvail = !!document.getElementById('add-game-available')?.checked;

      if (!name) {
        showToast('Game title is required.', 'warning');
        return;
      }

      try {
        const { error } = await supabase.from('games').insert({
          name: name,
          description: desc,
          image_url: img || null,
          is_available: isAvail,
          round_id: currentRound ? currentRound.id : null
        });

        if (error) throw error;

        closeActiveModal();
        showToast(`Candidate game "${name}" added!`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        showToast(`Failed to add game: ${err.message}`, 'error');
      }
    }, 'Create Game');
  }

  // Modal: Edit Candidate Game
  function openEditGameModal(gameId) {
    if (!currentProfile?.is_admin) return;
    const game = allGames.find(g => g.id === gameId);
    if (!game) return;

    const bodyHtml = `
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Game Title</label>
        <input type="text" id="edit-game-name" class="form-input" style="width: 100%;" value="${escapeHtml(game.name)}" />
      </div>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Description</label>
        <textarea id="edit-game-desc" class="form-input" style="width: 100%; height: 70px;">${escapeHtml(game.description || '')}</textarea>
      </div>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Image / Artwork URL</label>
        <input type="text" id="edit-game-img" class="form-input" style="width: 100%;" value="${escapeHtml(game.image_url || '')}" />
      </div>
      <div class="form-group">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem;">
          <input type="checkbox" id="edit-game-available" ${game.is_available ? 'checked' : ''} />
          <span>Available for voting</span>
        </label>
      </div>
    `;

    openModal(`✏️ Edit Game: ${game.name}`, bodyHtml, async () => {
      const name = (document.getElementById('edit-game-name')?.value || '').trim();
      const desc = (document.getElementById('edit-game-desc')?.value || '').trim();
      const img = (document.getElementById('edit-game-img')?.value || '').trim();
      const isAvail = !!document.getElementById('edit-game-available')?.checked;

      if (!name) {
        showToast('Game title is required.', 'warning');
        return;
      }

      try {
        const { error } = await supabase.from('games').update({
          name: name,
          description: desc,
          image_url: img || null,
          is_available: isAvail,
          updated_at: new Date().toISOString()
        }).eq('id', game.id);

        if (error) throw error;

        closeActiveModal();
        showToast(`Game "${name}" updated successfully!`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        showToast(`Failed to update game: ${err.message}`, 'error');
      }
    }, 'Update Details');
  }

  // Modal: Start New Voting Round (Preserving All History)
  function openNewRoundModal() {
    if (!currentProfile?.is_admin) return;

    const roundNum = roundHistory.length + 1;
    const bodyHtml = `
      <p style="margin-bottom: 12px; color: var(--color-text-secondary); font-size: 0.88rem;">
        Starting a new voting round will archive the current round and reset the active leaderboard.
        <br><strong>Historical rounds and votes are strictly preserved.</strong>
      </p>
      <div class="form-group" style="margin-bottom: 12px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Round Title</label>
        <input type="text" id="new-round-title" class="form-input" style="width: 100%;" value="Round ${roundNum}: Next Community Game Choice" />
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Round Description / Theme</label>
        <textarea id="new-round-desc" class="form-input" style="width: 100%; height: 60px;">Choose which prototype should graduate to full studio production!</textarea>
      </div>
      <div style="background: rgba(0, 230, 118, 0.08); border-left: 3px solid #00E676; padding: 10px; border-radius: 4px; font-size: 0.78rem; color: #a39eb8;">
        ✅ <strong>Visitor Fresh Votes:</strong> All visitors receive a fresh vote for this new cycle.
      </div>
    `;

    openModal('➕ Start New Voting Round', bodyHtml, async () => {
      const title = (document.getElementById('new-round-title')?.value || '').trim();
      const desc = (document.getElementById('new-round-desc')?.value || '').trim();

      if (!title) {
        showToast('Round title is required.', 'warning');
        return;
      }

      try {
        // 1. Try RPC start_new_voting_round
        let rpcSuccess = false;
        try {
          const { data, error } = await supabase.rpc('start_new_voting_round', {
            p_title: title,
            p_description: desc
          });
          if (!error && data && data.success) rpcSuccess = true;
        } catch (e) {}

        // 2. Direct table fallback
        if (!rpcSuccess) {
          // Archive previous open rounds
          await supabase.from('voting_rounds').update({
            status: 'archived',
            is_active: false,
            updated_at: new Date().toISOString()
          }).eq('status', 'open');

          // Insert new open round
          const { error: insError } = await supabase.from('voting_rounds').insert({
            title: title,
            description: desc,
            status: 'open',
            is_active: true
          });

          if (insError) throw insError;
        }

        closeActiveModal();
        showToast(`🎉 "${title}" started! Fresh votes are now open.`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        showToast(`Failed to start new round: ${err.message}`, 'error');
      }
    }, 'Launch Round');
  }

  // Modal: Declare Round Winner
  function openWinnerModal() {
    if (!currentProfile?.is_admin || !currentRound) return;

    const { ranked, leader } = calculateLeaderboard();
    const defaultWinnerId = leader ? leader.id : (ranked[0] ? ranked[0].id : '');

    const bodyHtml = `
      <p style="margin-bottom: 12px; color: var(--color-text-secondary); font-size: 0.88rem;">
        Declaring a winner marks the chosen game as the studio's <strong>Next Development Priority</strong> 
        and closes voting for this round.
      </p>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Select Winning Candidate</label>
        <select id="winner-game-select" class="form-input" style="width: 100%;">
          ${ranked.map(game => `
            <option value="${game.id}" ${game.id === defaultWinnerId ? 'selected' : ''}>
              ${escapeHtml(game.name)} (${game.votes} votes - ${game.percentageStr})
            </option>
          `).join('')}
        </select>
      </div>
      <div style="background: rgba(255, 215, 0, 0.1); border-left: 3px solid #FFD700; padding: 10px; border-radius: 4px; font-size: 0.78rem; color: #ffd700;">
        👑 The winner will be prominently displayed on the community voting page as the active studio development milestone.
      </div>
    `;

    openModal('🏆 Declare Round Winner', bodyHtml, async () => {
      const select = document.getElementById('winner-game-select');
      const winnerId = select ? select.value : '';

      if (!winnerId) {
        showToast('Please select a winning game candidate.', 'warning');
        return;
      }

      try {
        let rpcSuccess = false;
        try {
          const { data, error } = await supabase.rpc('declare_voting_winner', {
            p_round_id: currentRound.id,
            p_winner_game_id: winnerId
          });
          if (!error && data && data.success) rpcSuccess = true;
        } catch (e) {}

        if (!rpcSuccess) {
          const { error } = await supabase.from('voting_rounds').update({
            winner_game_id: winnerId,
            status: 'closed',
            is_active: false,
            end_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', currentRound.id);

          if (error) throw error;
        }

        const winningGame = allGames.find(g => g.id === winnerId);
        closeActiveModal();
        playSound('victory');
        showToast(`🏆 "${winningGame ? winningGame.name : 'Candidate'}" declared Winner & Next Development Priority!`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        showToast(`Failed to declare winner: ${err.message}`, 'error');
      }
    }, 'Declare Winner');
  }

  // Modal: Authentication (Admin login & account switch)
  function openAuthModal() {
    const isAnon = currentUser ? currentUser.is_anonymous : true;
    const bodyHtml = `
      <div style="margin-bottom: 12px;">
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.5;">
          ${isAnon 
            ? 'You are currently participating with a persistent <strong>Anonymous Community Voter ID</strong>. If you are a studio administrator or wish to link an email account, sign in below:' 
            : `Logged in as <strong>${escapeHtml(currentUser.email || 'Community User')}</strong>.`}
        </p>
      </div>
      <div class="form-group" style="margin-bottom: 10px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Admin / Account Email</label>
        <input type="email" id="auth-email-input" class="form-input" style="width: 100%;" placeholder="developer@catnipstudios.com" />
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Password</label>
        <input type="password" id="auth-password-input" class="form-input" style="width: 100%;" placeholder="••••••••" />
      </div>
      <div id="auth-modal-error" style="display: none; color: #FF5252; font-size: 0.8rem; margin-bottom: 10px;"></div>
    `;

    openModal('🔑 Studio Voter / Admin Sign In', bodyHtml, async () => {
      const email = (document.getElementById('auth-email-input')?.value || '').trim();
      const password = (document.getElementById('auth-password-input')?.value || '').trim();
      const errBox = document.getElementById('auth-modal-error');

      if (!email || !password) {
        if (errBox) {
          errBox.textContent = 'Please provide both email and password.';
          errBox.style.display = 'block';
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        currentUser = data.user;
        await fetchUserProfile();
        closeActiveModal();
        playSound('coin');
        showToast(`Welcome back, ${escapeHtml(currentProfile?.display_name || email)}!`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        if (errBox) {
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        }
      }
    }, 'Sign In');
  }

  // Modal: Historical Rounds Archive Viewer
  function openArchiveModal() {
    if (roundHistory.length === 0) {
      showToast('No round history recorded yet.', 'info');
      return;
    }

    const bodyHtml = `
      <p style="margin-bottom: 15px; color: var(--color-text-secondary); font-size: 0.88rem;">
        Browse past Catnip Studios community voting cycles, final results, and declared game winners:
      </p>
      <div class="archive-rounds-list">
        ${roundHistory.map(round => {
          const isWinner = !!round.winner_game_id;
          const winnerGame = isWinner ? allGames.find(g => g.id === round.winner_game_id) : null;
          const isCurrent = currentRound && round.id === currentRound.id;

          return `
            <div class="archive-round-card ${isCurrent ? 'archive-current' : ''}">
              <div class="archive-card-top">
                <span class="archive-status-tag ${round.status === 'open' ? 'tag-open' : 'tag-closed'}">${round.status.toUpperCase()}</span>
                ${isCurrent ? '<span class="archive-active-badge">Active Round</span>' : ''}
              </div>
              <h4 class="archive-title">${escapeHtml(round.title)}</h4>
              <p class="archive-desc">${escapeHtml(round.description || '')}</p>
              ${winnerGame ? `
                <div class="archive-winner-badge">
                  <span>🏆 Declared Winner: <strong>${escapeHtml(winnerGame.name)}</strong></span>
                </div>
              ` : ''}
              <div class="archive-dates">
                <span>Started: ${new Date(round.start_date || round.created_at).toLocaleDateString()}</span>
                ${round.end_date ? ` • <span>Closed: ${new Date(round.end_date).toLocaleDateString()}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    openModal('📜 Historical Voting Rounds Archive', bodyHtml, null);
  }

  // Sign out back to anonymous voter
  async function signOut() {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      currentUser = null;
      currentProfile = null;
      await ensureAuthSession();
      await fetchUserProfile();
      showToast('Signed out. Restored anonymous community voter session.', 'info');
      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Sign out error:', err);
    }
  }

  // Helpers
  function setButtonLoading(gameId, isLoading) {
    const btn = document.getElementById(`btn-vote-${gameId}`);
    if (!btn) return;
    btn.disabled = isLoading;
    const txt = btn.querySelector('.btn-vote-text');
    if (txt) {
      txt.textContent = isLoading ? 'Recording Vote...' : (userVote && userVote.game_id === gameId ? '✓ Voted' : 'Vote for This Game');
    }
  }

  function setLoadingState(isLoading) {
    const container = document.getElementById('voting-candidates-grid');
    if (!container) return;
    if (isLoading && (!allGames || allGames.length === 0)) {
      container.innerHTML = `
        <div class="voting-loading-spinner" style="grid-column: 1 / -1;">
          <div class="voting-spinner"></div>
          <p>Syncing live candidate standings with Supabase...</p>
        </div>
      `;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getPlaceholderSvg(title) {
    const safeTitle = (title || 'Catnip Game').substring(0, 18);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#140e2b" />
            <stop offset="50%" stop-color="#1b1238" />
            <stop offset="100%" stop-color="#0a0614" />
          </linearGradient>
        </defs>
        <rect width="400" height="220" fill="url(#grad)" />
        <circle cx="200" cy="90" r="45" fill="rgba(124, 77, 255, 0.15)" stroke="#7C4DFF" stroke-width="1.5" stroke-dasharray="4 2" />
        <circle cx="200" cy="90" r="28" fill="rgba(0, 176, 255, 0.2)" stroke="#00B0FF" stroke-width="2" />
        <text x="200" y="98" font-size="28" text-anchor="middle">🐾</text>
        <text x="200" y="165" font-family="'Outfit', 'Space Grotesk', sans-serif" font-weight="700" font-size="16" fill="#f5f4f8" text-anchor="middle">${safeTitle}</text>
        <text x="200" y="185" font-family="'Space Grotesk', monospace" font-size="11" fill="#7C4DFF" text-anchor="middle">CATNIP STUDIOS CANDIDATE</text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Main Public Init function
  async function init() {
    if (isInitializing) return;
    isInitializing = true;

    try {
      const connected = await initClient();
      if (connected) {
        setupRealtime();
        await refreshData();
      }
      isInitialized = true;
    } catch (e) {
      console.error('[Catnip Voting] Initialization failed:', e);
    } finally {
      isInitializing = false;
    }
  }

  // Export to window
  window.CatnipVoting = {
    init,
    voteForGame,
    refreshData,
    openConfigModal,
    openAddGameModal,
    openEditGameModal,
    openNewRoundModal,
    openWinnerModal,
    openArchiveModal,
    openAuthModal,
    closeModal: closeActiveModal,
    toggleRoundStatus,
    toggleGameAvailability,
    safeDeleteGame,
    signOut,
    getConfig
  };

  // Auto-init if DOM is already loaded and on voting hash
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.location.hash === '#voting') {
      setTimeout(init, 100);
    }
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.hash === '#voting') {
        setTimeout(init, 100);
      }
    });
  }

})(window);
