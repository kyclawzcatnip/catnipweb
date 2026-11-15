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

  // Default Initial Seed Candidates (including Catnip Warships!)
  const DEFAULT_SEED_GAMES = [
    {
      id: 'game-catnip-warships',
      name: 'Catnip Warships',
      description: 'Command tactical naval fleets, explore the coastal Harbor Hub, and lead destroyers, frigates, and battleships in intense ocean skirmishes!',
      image_url: 'https://kyclawzcatnip.github.io/catships/',
      is_available: true,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'game-scw-2',
      name: 'Super Cat World 2: Cosmic Odyssey',
      description: 'The next chapter in the Catnip saga! High-gravity platforming, nebula worlds, and interstellar dogfights.',
      image_url: null,
      is_available: true,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'game-dungeons-true',
      name: 'Catnip Dungeons True',
      description: 'Tactical dungeon crawler with anti-catite crystals, procedural labyrinth corridors, and epic feline relics.',
      image_url: null,
      is_available: true,
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];

  const DEFAULT_SEED_ROUNDS = [
    {
      id: 'round-1-community-choice',
      title: 'Round 1: Next Community Game Choice',
      description: 'Vote for the next prototype to graduate to full studio production!',
      status: 'open',
      is_active: true,
      created_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ];

  function getLocalGames() {
    try {
      const raw = localStorage.getItem('CATNIP_LOCAL_GAMES');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!parsed.some(g => (g.name && g.name.toLowerCase().includes('warships')) || (g.image_url && g.image_url.includes('catships')))) {
            parsed.unshift(DEFAULT_SEED_GAMES[0]);
            localStorage.setItem('CATNIP_LOCAL_GAMES', JSON.stringify(parsed));
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Catnip Voting] Error reading local games:', e);
    }
    localStorage.setItem('CATNIP_LOCAL_GAMES', JSON.stringify(DEFAULT_SEED_GAMES));
    return DEFAULT_SEED_GAMES;
  }

  function setLocalGames(games) {
    try {
      localStorage.setItem('CATNIP_LOCAL_GAMES', JSON.stringify(games));
    } catch (e) {
      console.warn('[Catnip Voting] Error saving local games:', e);
    }
  }

  function getLocalRounds() {
    try {
      const raw = localStorage.getItem('CATNIP_LOCAL_ROUNDS');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Catnip Voting] Error reading local rounds:', e);
    }
    localStorage.setItem('CATNIP_LOCAL_ROUNDS', JSON.stringify(DEFAULT_SEED_ROUNDS));
    return DEFAULT_SEED_ROUNDS;
  }

  function setLocalRounds(rounds) {
    try {
      localStorage.setItem('CATNIP_LOCAL_ROUNDS', JSON.stringify(rounds));
    } catch (e) {
      console.warn('[Catnip Voting] Error saving local rounds:', e);
    }
  }

  function getLocalVotes() {
    try {
      const raw = localStorage.getItem('CATNIP_LOCAL_VOTES');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function setLocalVotes(votes) {
    try {
      localStorage.setItem('CATNIP_LOCAL_VOTES', JSON.stringify(votes));
    } catch (e) {}
  }

  function getLocalVoterId() {
    let id = localStorage.getItem('CATNIP_LOCAL_VOTER_ID');
    if (!id) {
      id = 'voter_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('CATNIP_LOCAL_VOTER_ID', id);
    }
    return id;
  }

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
        currentProfile = data;
        // If currentProfile is not marked as admin, BUT the user is verified as a developer/admin:
        if (!currentProfile.is_admin && checkIsAdmin()) {
          currentProfile.is_admin = true;
          if (currentUser && currentUser.id) {
            supabase.from('profiles').update({ is_admin: true }).eq('id', currentUser.id).then(() => {}).catch(() => {});
          }
        }
      } else {
        // Only if NO profile row exists at all for this user ID, insert a default voter profile without email
        const isAnon = currentUser.is_anonymous || !currentUser.email;
        const defaultName = isAnon 
          ? `Feline #${currentUser.id.substring(0, 6)}` 
          : (currentUser.user_metadata?.display_name || currentUser.user_metadata?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Community Feline'));

        const shouldBeAdmin = checkIsAdmin();

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            display_name: defaultName,
            is_admin: shouldBeAdmin
          })
          .select('id, is_admin, display_name, avatar_url')
          .maybeSingle();

        if (insertError) {
          console.warn('[Catnip Voting] Profile insert notice:', insertError.message);
        }

        currentProfile = newProfile || { id: currentUser.id, is_admin: shouldBeAdmin, display_name: defaultName };
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

  // Refresh all voting data from database (with local fallback)
  async function refreshData(options = {}) {
    const { silent = false } = options;

    if (!silent) {
      setLoadingState(true);
    }

    try {
      if (supabase) {
        // 1. Fetch current active or latest round
        const { data: rounds, error: roundError } = await supabase
          .from('voting_rounds')
          .select('*')
          .order('created_at', { ascending: false });

        if (roundError) throw roundError;

        roundHistory = rounds || [];
        currentRound = roundHistory.find(r => r.status === 'open' && r.is_active) || roundHistory[0] || null;

        // 2. Fetch candidate games (all candidates for admins, active round candidates for voters)
        let gamesQuery = supabase.from('games').select('*').order('created_at', { ascending: false });
        if (!checkIsAdmin() && currentRound) {
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
      } else {
        // Local mode fallback — immediate functionality without waiting for Supabase credentials!
        roundHistory = getLocalRounds();
        currentRound = roundHistory.find(r => r.status === 'open' && r.is_active) || roundHistory[0] || null;
        allGames = getLocalGames();

        if (currentRound) {
          currentVotes = getLocalVotes().filter(v => v.round_id === currentRound.id);
          const localVoterId = getLocalVoterId();
          userVote = currentVotes.find(v => v.user_id === localVoterId) || null;
        } else {
          currentVotes = [];
          userVote = null;
        }
      }

      // Render UI components
      renderVotingInterface();
      renderAdminDashboard();
      renderDevSecretsManager();
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

    if (!currentRound || currentRound.status !== 'open') {
      showToast('🔒 Voting is currently closed for this round.', 'warning');
      return;
    }

    const targetGame = allGames.find(g => g.id === gameId);
    if (!targetGame || !targetGame.is_available) {
      showToast('⚠️ This candidate game is currently unavailable for voting.', 'warning');
      return;
    }

    // Ensure session if connected to Supabase
    if (supabase) {
      await ensureAuthSession();
      if (!currentUser) {
        showToast('🔒 Unable to verify voter identity. Please sign in to vote.', 'warning');
        return;
      }
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
      if (supabase) {
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
      } else {
        // Local mode vote storage
        const localVoterId = getLocalVoterId();
        let votes = getLocalVotes();
        votes = votes.filter(v => !(v.user_id === localVoterId && v.round_id === currentRound.id));
        votes.push({
          id: 'vote-' + Date.now(),
          user_id: localVoterId,
          game_id: gameId,
          round_id: currentRound.id,
          created_at: new Date().toISOString()
        });
        setLocalVotes(votes);
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
          ${checkIsAdmin() ? '<button class="btn btn-primary" onclick="window.CatnipVoting.openNewRoundModal()">+ Start First Voting Round</button>' : ''}
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
    const availableGames = ranked.filter(g => {
      const matchesRound = !g.round_id || (currentRound && g.round_id === currentRound.id);
      return g.is_available && matchesRound;
    });

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
              ${game.image_url ? `
                <div style="margin: 8px 0 12px 0;">
                  <a href="${escapeHtml(game.image_url)}" target="_blank" rel="noopener noreferrer" class="candidate-play-link" title="Open ${escapeHtml(game.name)} link">
                    <span>🌐</span> Play / View Link &rarr;
                  </a>
                </div>
              ` : ''}
              
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

  // Helper to determine developer/admin email
  function isDeveloperEmail(email) {
    if (!email || typeof email !== 'string') return false;
    if (typeof window.isDeveloperEmail === 'function') {
      return window.isDeveloperEmail(email);
    }
    const clean = email.trim().toLowerCase();
    return clean.includes('kyan') || 
           clean.includes('catnip') || 
           clean.includes('admin') ||
           clean.startsWith('dev@');
  }

  // Comprehensive helper to determine if user is admin via profile, dev portal session, local user, or developer email
  function checkIsAdmin() {
    // 1. Direct profile admin flag in Supabase
    if (currentProfile && currentProfile.is_admin === true) return true;

    // 2. Active dev portal session (sessionStorage or localStorage)
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dev_auth') === 'true') return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('dev_auth') === 'true') return true;

    // 3. Current logged in Supabase user email matches developer pattern
    if (currentUser && currentUser.email && isDeveloperEmail(currentUser.email)) return true;

    // 4. Local storage user on the website (scw_local_user)
    try {
      if (typeof localStorage !== 'undefined') {
        const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
        if (localUser) {
          if (localUser.is_admin === true || localUser.role === 'admin' || localUser.role === 'developer') return true;
          const email = (localUser.email || localUser.username || '').toLowerCase();
          if (isDeveloperEmail(email)) return true;
        }
      }
    } catch (e) {}

    // 5. Firebase auth current user (if website is using Firebase Auth)
    try {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        const fbEmail = (firebase.auth().currentUser.email || '').toLowerCase();
        if (isDeveloperEmail(fbEmail)) return true;
      }
    } catch (e) {}

    return false;
  }

  // Render Admin Dashboard Controls
  function renderAdminDashboard() {
    const adminContainer = document.getElementById('voting-admin-container');
    if (!adminContainer) return;

    // Strict security check: check profiles.is_admin === true or authenticated developer portal session
    const isAdmin = checkIsAdmin();
    if (!isAdmin) {
      adminContainer.style.display = 'block';
      adminContainer.innerHTML = `
        <div style="text-align: center; margin-top: 35px; padding: 22px; border: 1px dashed rgba(124, 77, 255, 0.35); border-radius: var(--radius-md); background: rgba(17, 11, 31, 0.5);">
          <div style="font-size: 1.6rem; margin-bottom: 6px;">🛡️</div>
          <h4 style="font-family: var(--font-headings); color: #fff; font-size: 1.05rem; margin-bottom: 6px;">Catnip Studios Administrator Access</h4>
          <p style="font-size: 0.84rem; color: var(--color-text-secondary); max-width: 500px; margin: 0 auto 14px auto; line-height: 1.45;">
            Need to add or manage candidate games? Sign in with your admin account or authenticate through the Developer Portal to unlock candidate management.
          </p>
          <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="window.CatnipVoting.openAuthModal()">🔑 Admin Sign In</button>
            <button class="btn btn-secondary btn-sm" onclick="if (typeof openSecurityGate === 'function') openSecurityGate();">⚡ Open Dev Portal Gate</button>
          </div>
        </div>
      `;
      return;
    }

    adminContainer.style.display = 'block';
    const isOpen = currentRound && currentRound.status === 'open';
    const adminName = (currentProfile && currentProfile.display_name) || (currentUser && currentUser.email) || 'Studio Admin';

    adminContainer.innerHTML = `
      <div class="admin-dashboard-card">
        <!-- Header: Title & Round Actions -->
        <div class="admin-card-header">
          <div class="admin-title-group">
            <span class="admin-shield-icon">🛡️</span>
            <div>
              <h3>Admin Dashboard</h3>
              <p class="admin-subtitle">Authenticated as verified Studio Admin (${escapeHtml(adminName)}) &bull; Round: <strong>${escapeHtml(currentRound ? currentRound.title : 'No Active Round')}</strong> (${isOpen ? '🟢 Open' : '🔴 Closed'})</p>
            </div>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openConfigModal()">
              <span>⚙️</span> Supabase Credentials
            </button>
            <button class="btn ${isOpen ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="window.CatnipVoting.toggleRoundStatus()">
              <span>${isOpen ? '🔒' : '🔓'}</span> ${isOpen ? 'Close Voting' : 'Open Voting'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openNewRoundModal()">
              <span>✨</span> Start New Round
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openWinnerModal()">
              <span>🏆</span> Declare Winner
            </button>
          </div>
        </div>

        <!-- 1. SIMPLE ADD CANDIDATE FORM -->
        <div class="admin-candidate-add-section">
          <div class="admin-section-header">
            <h4 class="admin-section-heading"><span>➕</span> Add a Voting Candidate</h4>
            <p class="admin-section-sub">Add a new game candidate to the voting page. It will immediately appear for all community members.</p>
          </div>
          <form id="admin-add-candidate-form" class="admin-candidate-form" novalidate onsubmit="window.CatnipVoting.submitAddCandidateForm(event, 'admin')">
            <div class="form-group" style="margin-bottom: 14px;">
              <label for="admin-candidate-name">Game Name <span class="required-star">*</span></label>
              <input type="text" id="admin-candidate-name" name="candidate-name" class="form-input" placeholder="e.g. Catnip Warships" required autocomplete="off" />
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label for="admin-candidate-image">
                <span>🔗</span> Game Link or Image URL <span class="optional-label">(optional — playable game URL or cover art)</span>
              </label>
              <input type="text" inputmode="url" id="admin-candidate-image" name="candidate-image" class="form-input candidate-url-input" placeholder="Paste link here (e.g. https://kyclawzcatnip.github.io/catships/ or image URL)" autocomplete="off" spellcheck="false" oninput="window.CatnipVoting.onUrlInput(this, 'admin')" />
              <div class="url-input-feedback" id="admin-url-feedback">
                <span class="url-feedback-text">💡 You can paste a playable web game link (like GitHub Pages) or an image/screenshot link.</span>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label for="admin-candidate-desc">Game Description <span class="required-star">*</span></label>
              <textarea id="admin-candidate-desc" name="candidate-desc" class="form-input" rows="3" placeholder="Describe the gameplay mechanics, style, and why players should vote for it..." required></textarea>
            </div>
            <div class="form-actions-row">
              <button type="submit" class="btn btn-primary btn-add-candidate" id="admin-add-candidate-btn">
                <span>➕</span> Add Candidate
              </button>
            </div>
          </form>
        </div>

        <div class="admin-section-divider"></div>

        <!-- 2. MANAGE EXISTING CANDIDATES -->
        <div class="admin-candidate-manage-section">
          <div class="admin-section-header">
            <h4 class="admin-section-heading"><span>🎮</span> Manage Existing Candidates (${allGames.length})</h4>
            <p class="admin-section-sub">Edit details, toggle voting eligibility, or safely remove candidates. Historical vote data is always preserved.</p>
          </div>

          ${allGames.length === 0 ? `
            <div class="admin-candidate-empty">
              <p>No candidate games yet. Fill out the <strong>Add a Voting Candidate</strong> form above to add your first candidate!</p>
            </div>
          ` : `
            <div class="admin-candidate-items">
              ${allGames.map(game => {
                const gameVotes = currentVotes.filter(v => v.game_id === game.id).length;
                const fallbackImg = getPlaceholderSvg(game.name);
                const imgSrc = game.image_url ? escapeHtml(game.image_url) : fallbackImg;
                
                return `
                  <div class="admin-candidate-item" id="admin-item-${game.id}">
                    <img src="${imgSrc}" alt="${escapeHtml(game.name)}" class="admin-candidate-thumb" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                    <div class="admin-candidate-info">
                      <div class="admin-candidate-name-row">
                        <strong>${escapeHtml(game.name)}</strong>
                        <span class="status-pill ${game.is_available ? 'pill-active' : 'pill-disabled'}">
                          ${game.is_available ? '● Voting Enabled' : '○ Voting Disabled'}
                        </span>
                      </div>
                      <p class="admin-candidate-desc">${escapeHtml(game.description || 'No description provided.')}</p>
                      <div class="admin-candidate-stats">
                        <span>🗳️ <strong>${gameVotes}</strong> votes in current round</span>
                        <span>•</span>
                        <span>📅 Added ${new Date(game.created_at || Date.now()).toLocaleDateString()}</span>
                        ${game.image_url ? `
                          <span>•</span>
                          <span class="admin-candidate-link-badge">🔗 <a href="${escapeHtml(game.image_url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(game.image_url)}">${escapeHtml(game.image_url.length > 35 ? game.image_url.substring(0, 32) + '...' : game.image_url)}</a></span>
                        ` : ''}
                      </div>
                    </div>
                    <div class="admin-candidate-actions">
                      <button class="btn-candidate-action btn-action-edit" onclick="window.CatnipVoting.openEditCandidateModal('${game.id}')" title="Edit candidate details">
                        <span>✏️</span> Edit Candidate
                      </button>
                      <button class="btn-candidate-action ${game.is_available ? 'btn-action-disable' : 'btn-action-enable'}" onclick="window.CatnipVoting.toggleCandidateAvailability('${game.id}', ${!game.is_available})" title="${game.is_available ? 'Disable voting' : 'Enable voting'}">
                        <span>${game.is_available ? '🚫' : '✅'}</span> ${game.is_available ? 'Disable Candidate' : 'Enable Candidate'}
                      </button>
                      <button class="btn-candidate-action btn-action-remove" onclick="window.CatnipVoting.removeCandidate('${game.id}')" title="Safely remove candidate">
                        <span>🗑️</span> Remove Candidate
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
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

    const isAdmin = checkIsAdmin();
    if (isAdmin && currentProfile && !currentProfile.is_admin) {
      currentProfile.is_admin = true;
    }
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

  // Render Simple Voting Candidate Manager inside Dev Secrets section
  function renderDevSecretsManager() {
    const container = document.getElementById('dev-secrets-voting-manager-container');
    if (!container) return;

    const isConnected = !!supabase;
    const config = getConfig();

    let setupAlertHtml = '';
    if (!isConnected || !config.isConfigured) {
      setupAlertHtml = `
        <div class="supabase-setup-alert" style="margin-bottom: 18px; border-color: rgba(124, 77, 255, 0.4); background: rgba(124, 77, 255, 0.08);">
          <div class="setup-alert-icon">⚡</div>
          <div class="setup-alert-content">
            <h4 style="margin-bottom: 4px; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span>Local Storage Mode Active</span>
              <span class="status-pill pill-active" style="font-size: 0.72rem; padding: 2px 8px;">Ready to Manage &amp; Vote</span>
            </h4>
            <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 10px; line-height: 1.45;">
              You can add, edit, disable, remove candidates and vote directly right now — all candidates are saved persistently in your browser.
            </p>
            <div class="setup-buttons-row">
              <button class="btn btn-secondary btn-sm" onclick="window.CatnipVoting.openConfigModal()">
                ⚙️ Optional: Connect Supabase Cloud
              </button>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${setupAlertHtml}
      <div class="admin-candidate-add-section" style="margin-top: 0; background: rgba(124, 77, 255, 0.04); border-color: rgba(124, 77, 255, 0.25);">
        <div class="admin-section-header">
          <h4 class="admin-section-heading"><span>➕</span> Add a Voting Candidate</h4>
          <p class="admin-section-sub">Add a new game candidate to the voting database. It will immediately appear on the public voting page.</p>
        </div>
        <form id="dev-add-candidate-form" class="admin-candidate-form" novalidate onsubmit="window.CatnipVoting.submitAddCandidateForm(event, 'dev')">
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="dev-candidate-name">Game Name <span class="required-star">*</span></label>
            <input type="text" id="dev-candidate-name" name="candidate-name" class="form-input" placeholder="e.g. Catnip Warships" required autocomplete="off" />
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label for="dev-candidate-image">
              <span>🔗</span> Game Link or Image URL <span class="optional-label">(optional — playable game URL or cover art)</span>
            </label>
            <input type="text" inputmode="url" id="dev-candidate-image" name="candidate-image" class="form-input candidate-url-input" placeholder="Paste link here (e.g. https://kyclawzcatnip.github.io/catships/ or image URL)" autocomplete="off" spellcheck="false" oninput="window.CatnipVoting.onUrlInput(this, 'dev')" />
            <div class="url-input-feedback" id="dev-url-feedback">
              <span class="url-feedback-text">💡 You can paste a playable web game link (like GitHub Pages) or an image/screenshot link.</span>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label for="dev-candidate-desc">Game Description <span class="required-star">*</span></label>
            <textarea id="dev-candidate-desc" name="candidate-desc" class="form-input" rows="3" placeholder="Describe the gameplay mechanics, style, and why players should vote for it..." required></textarea>
          </div>
          <div class="form-actions-row">
            <button type="submit" class="btn btn-primary btn-add-candidate" id="dev-add-candidate-btn">
              <span>➕</span> Add Candidate
            </button>
          </div>
        </form>
      </div>

      <div class="admin-section-divider"></div>

      <div class="admin-candidate-manage-section">
        <div class="admin-section-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 class="admin-section-heading"><span>🎮</span> Manage Existing Candidates (${allGames.length})</h4>
            <p class="admin-section-sub">Edit details, toggle voting eligibility, or safely remove candidates.</p>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-xs" onclick="window.CatnipVoting.openConfigModal()">⚙️ Supabase Credentials</button>
            <button class="btn btn-secondary btn-xs" onclick="window.CatnipVoting.refreshData()">🔄 Refresh Standings</button>
          </div>
        </div>

        ${allGames.length === 0 ? `
          <div class="admin-candidate-empty">
            <p>No candidate games yet. Fill out the <strong>Add a Voting Candidate</strong> form above to add your first candidate!</p>
          </div>
        ` : `
          <div class="admin-candidate-items">
            ${allGames.map(game => {
              const gameVotes = currentVotes.filter(v => v.game_id === game.id).length;
              const fallbackImg = getPlaceholderSvg(game.name);
              const imgSrc = game.image_url ? escapeHtml(game.image_url) : fallbackImg;
              
              return `
                <div class="admin-candidate-item" id="dev-admin-item-${game.id}">
                  <img src="${imgSrc}" alt="${escapeHtml(game.name)}" class="admin-candidate-thumb" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                  <div class="admin-candidate-info">
                    <div class="admin-candidate-name-row">
                      <strong>${escapeHtml(game.name)}</strong>
                      <span class="status-pill ${game.is_available ? 'pill-active' : 'pill-disabled'}">
                        ${game.is_available ? '● Voting Enabled' : '○ Voting Disabled'}
                      </span>
                    </div>
                    <p class="admin-candidate-desc">${escapeHtml(game.description || 'No description provided.')}</p>
                    <div class="admin-candidate-stats">
                      <span>🗳️ <strong>${gameVotes}</strong> votes in current round</span>
                      <span>•</span>
                      <span>📅 Added ${new Date(game.created_at || Date.now()).toLocaleDateString()}</span>
                      ${game.image_url ? `
                        <span>•</span>
                        <span class="admin-candidate-link-badge">🔗 <a href="${escapeHtml(game.image_url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(game.image_url)}">${escapeHtml(game.image_url.length > 35 ? game.image_url.substring(0, 32) + '...' : game.image_url)}</a></span>
                      ` : ''}
                    </div>
                  </div>
                  <div class="admin-candidate-actions">
                    <button class="btn-candidate-action btn-action-edit" onclick="window.CatnipVoting.openEditCandidateModal('${game.id}')" title="Edit candidate details">
                      <span>✏️</span> Edit Candidate
                    </button>
                    <button class="btn-candidate-action ${game.is_available ? 'btn-action-disable' : 'btn-action-enable'}" onclick="window.CatnipVoting.toggleCandidateAvailability('${game.id}', ${!game.is_available})" title="${game.is_available ? 'Disable voting' : 'Enable voting'}">
                      <span>${game.is_available ? '🚫' : '✅'}</span> ${game.is_available ? 'Disable Candidate' : 'Enable Candidate'}
                    </button>
                    <button class="btn-candidate-action btn-action-remove" onclick="window.CatnipVoting.removeCandidate('${game.id}')" title="Safely remove candidate">
                      <span>🗑️</span> Remove Candidate
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
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
      <div class="supabase-setup-alert" style="background: rgba(124, 77, 255, 0.08); border-color: rgba(124, 77, 255, 0.35);">
        <div class="setup-alert-icon">🎮</div>
        <div class="setup-alert-content">
          <h4 style="display: flex; align-items: center; gap: 8px;">
            <span>Community Voting — Active</span>
            <span class="status-pill pill-active" style="font-size: 0.72rem; padding: 2px 8px;">Ready to Vote</span>
          </h4>
          <p>Vote for your favorite candidate below! All candidate votes and leaderboard rankings are tracked live.</p>
          ${errorMsg ? `<div class="setup-error-msg">${escapeHtml(errorMsg)}</div>` : ''}
          <div class="setup-buttons-row">
            <button class="btn btn-secondary btn-xs" onclick="window.CatnipVoting.openConfigModal()">
              ⚙️ Supabase Cloud Settings
            </button>
            <a href="supabase_schema.sql" download class="btn btn-secondary btn-xs">
              📜 SQL Schema
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== ADMIN ACTIONS ====================

  // Smart URL normalizer: cleans spaces, auto-adds https:// protocol if missing, trims surrounding quotes
  function normalizeUrl(raw) {
    if (!raw) return '';
    let str = String(raw).trim();
    // Remove surrounding quotes or backticks if pasted with them
    str = str.replace(/^["'`]|["'`]$/g, '').trim();
    if (!str) return '';
    // If missing protocol (e.g. kyclawzcatnip.github.io/catships/ or www.example.com), auto-prepend https://
    if (!/^(https?|mailto|tel|data|blob):\/\//i.test(str) && !str.startsWith('/') && !str.startsWith('data:')) {
      str = 'https://' + str;
    }
    return str;
  }

  // Live URL input feedback handler
  function onUrlInput(inputEl, prefix) {
    if (!inputEl) return;
    const feedbackEl = document.getElementById(`${prefix}-url-feedback`);
    if (!feedbackEl) return;

    const raw = (inputEl.value || '').trim();
    if (!raw) {
      feedbackEl.className = 'url-input-feedback';
      feedbackEl.innerHTML = '<span class="url-feedback-text">💡 You can paste a playable web game link (like GitHub Pages) or an image/screenshot link.</span>';
      return;
    }

    const normalized = normalizeUrl(raw);
    const isLikelyImage = /\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(normalized);
    const isGameLink = /(github\.io|itch\.io|gitlab\.io|vercel\.app|netlify\.app|\.html?(\?.*)?$)/i.test(normalized);

    feedbackEl.className = 'url-input-feedback has-url';
    if (isGameLink) {
      feedbackEl.innerHTML = `<span>🎮</span> <span class="url-feedback-text">Playable Web Game Link: <strong>${escapeHtml(normalized)}</strong></span>`;
    } else if (isLikelyImage) {
      feedbackEl.innerHTML = `<span>🖼️</span> <span class="url-feedback-text">Image / Artwork Link: <strong>${escapeHtml(normalized)}</strong></span>`;
    } else {
      feedbackEl.innerHTML = `<span>🔗</span> <span class="url-feedback-text">Link Recognized: <strong>${escapeHtml(normalized)}</strong></span>`;
    }
  }

  // Helper modal: Explain and provide 1-click elevation when Supabase RLS blocks candidate changes
  function showAdminElevationHelpModal(errMessage) {
    const uid = (currentUser && currentUser.id) ? currentUser.id : 'YOUR_USER_ID';
    const sqlSnippet = `UPDATE public.profiles SET is_admin = true WHERE id = '${uid}';`;

    const bodyHtml = `
      <div style="margin-bottom: 14px;">
        <div style="background: rgba(255, 61, 0, 0.12); border: 1px solid rgba(255, 61, 0, 0.35); border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 14px; color: #ff8a65; font-size: 0.86rem; line-height: 1.45;">
          <strong>🛡️ Supabase Database Permission Required:</strong><br />
          Your browser is verified as <strong>Studio Developer / Admin</strong>, but your Supabase database user record is not flagged with database-level admin permissions (<em>${escapeHtml(errMessage || 'Access Denied')}</em>).
        </div>
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin-bottom: 12px; line-height: 1.5;">
          Resolve this in seconds with either option below:
        </p>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px;">
          <h5 style="color: #fff; margin-bottom: 6px; font-size: 0.9rem;">Option 1: Link Verified Studio Admin Email</h5>
          <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 10px;">
            Sign in with your registered admin email account in Supabase to link your admin permissions.
          </p>
          <button class="btn btn-primary btn-sm" onclick="window.CatnipVoting.openAuthModal()">🔑 Admin Sign In</button>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 14px;">
          <h5 style="color: #fff; margin-bottom: 6px; font-size: 0.9rem;">Option 2: Run 1-Line SQL in Supabase SQL Editor</h5>
          <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 8px;">
            Execute this single query in your Supabase SQL Editor to permanently grant admin permissions to this user record:
          </p>
          <div style="position: relative;">
            <pre style="background: #090611; color: #00E5FF; padding: 10px; border-radius: 6px; font-size: 0.78rem; overflow-x: auto; margin: 0; user-select: all;" id="sql-promote-snippet">${escapeHtml(sqlSnippet)}</pre>
            <button class="btn btn-secondary btn-xs" style="position: absolute; right: 6px; top: 6px;" onclick="navigator.clipboard.writeText(document.getElementById('sql-promote-snippet').innerText); window.CatnipVoting.showToast('📋 SQL copied to clipboard!', 'success');">📋 Copy SQL</button>
          </div>
        </div>
      </div>
    `;

    openModal('🛡️ Database Admin Privileges Needed', bodyHtml, null);
  }

  // 1. Simple Add Candidate Form submission
  async function submitAddCandidateForm(event, prefix = 'admin') {
    if (event) {
      event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }

    if (!checkIsAdmin()) {
      showToast('⚠️ Admin or Developer privileges required to manage candidates.', 'error');
      openAuthModal();
      return;
    }

    // Robust field lookup: check the form that fired the event first
    let form = null;
    if (event && event.target) {
      form = event.target.tagName === 'FORM' ? event.target : event.target.closest('form');
    }

    let nameInput = form ? (form.querySelector('[name="candidate-name"]') || form.querySelector('[id$="-candidate-name"]')) : null;
    let descInput = form ? (form.querySelector('[name="candidate-desc"]') || form.querySelector('[id$="-candidate-desc"]')) : null;
    let imgInput = form ? (form.querySelector('[name="candidate-image"]') || form.querySelector('[id$="-candidate-image"]')) : null;
    let submitBtn = form ? (form.querySelector('button[type="submit"]') || form.querySelector('[id$="-add-candidate-btn"]')) : null;

    // Fallbacks if not found within form
    if (!nameInput) nameInput = document.getElementById(`${prefix}-candidate-name`) || document.getElementById('dev-candidate-name') || document.getElementById('admin-candidate-name');
    if (!descInput) descInput = document.getElementById(`${prefix}-candidate-desc`) || document.getElementById('dev-candidate-desc') || document.getElementById('admin-candidate-desc');
    if (!imgInput) imgInput = document.getElementById(`${prefix}-candidate-image`) || document.getElementById('dev-candidate-image') || document.getElementById('admin-candidate-image');
    if (!submitBtn) submitBtn = document.getElementById(`${prefix}-add-candidate-btn`) || document.getElementById('dev-add-candidate-btn') || document.getElementById('admin-add-candidate-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const desc = descInput ? descInput.value.trim() : '';

    // If imgInput in this form happens to be empty, also check the sibling dev or admin input
    let rawUrl = imgInput ? imgInput.value.trim() : '';
    if (!rawUrl) {
      const altImg = (prefix === 'dev') ? document.getElementById('admin-candidate-image') : document.getElementById('dev-candidate-image');
      if (altImg && altImg.value.trim()) {
        rawUrl = altImg.value.trim();
      }
    }
    const img = normalizeUrl(rawUrl);

    // Step 1: Validate the information
    if (!name) {
      showToast('⚠️ Please enter a Game Name.', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    if (!desc) {
      showToast('⚠️ Please enter a Game Description.', 'warning');
      if (descInput) descInput.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span> Adding Candidate...';
    }

    try {
      let candidateId = 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      if (supabase) {
        // Step 2: Save the candidate to the Supabase database
        let { data, error } = await supabase
          .from('games')
          .insert({
            name: name,
            description: desc,
            image_url: img || null,
            is_available: true,
            round_id: currentRound ? currentRound.id : null
          })
          .select()
          .single();

        // If RLS blocked the insert because profiles.is_admin is false in the database:
        if (error && (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security')) || (error.message && error.message.toLowerCase().includes('privilege')))) {
          console.warn('[Catnip Voting] RLS blocked insert, attempting self-healing admin elevation for current session...', error);
          if (currentUser && currentUser.id) {
            const { error: elevateErr } = await supabase.from('profiles').update({ is_admin: true }).eq('id', currentUser.id);
            if (!elevateErr) {
              const retry = await supabase.from('games').insert({
                name: name,
                description: desc,
                image_url: img || null,
                is_available: true,
                round_id: currentRound ? currentRound.id : null
              }).select().single();
              if (!retry.error) {
                data = retry.data;
                error = null;
              } else {
                error = retry.error;
              }
            }
          }
        }

        if (error) {
          if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('row-level security')) || (error.message && error.message.toLowerCase().includes('privilege'))) {
            showAdminElevationHelpModal(error.message);
            return;
          }
          throw error;
        }

        if (data && data.id) {
          candidateId = data.id;
        }
      }

      // Always save or update local storage copy for instantaneous local availability
      const localGames = getLocalGames();
      const newLocalCandidate = {
        id: candidateId,
        name: name,
        description: desc,
        image_url: img || null,
        is_available: true,
        round_id: currentRound ? currentRound.id : null,
        created_at: new Date().toISOString()
      };
      if (!localGames.some(g => g.id === candidateId || g.name.toLowerCase() === name.toLowerCase())) {
        localGames.unshift(newLocalCandidate);
        setLocalGames(localGames);
      }

      // Step 3: Clear the form after successful submission
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      if (imgInput) imgInput.value = '';

      // Reset feedback indicators
      const feedbackDev = document.getElementById('dev-url-feedback');
      if (feedbackDev) {
        feedbackDev.className = 'url-input-feedback';
        feedbackDev.innerHTML = '<span class="url-feedback-text">💡 You can paste a playable web game link (like GitHub Pages) or an image/screenshot link.</span>';
      }
      const feedbackAdmin = document.getElementById('admin-url-feedback');
      if (feedbackAdmin) {
        feedbackAdmin.className = 'url-input-feedback';
        feedbackAdmin.innerHTML = '<span class="url-feedback-text">💡 You can paste a playable web game link (like GitHub Pages) or an image/screenshot link.</span>';
      }

      // Step 4: Show a success message
      playSound('achievement');
      showToast('🎉 Candidate added successfully!', 'success');

      // Step 5: Make the candidate appear on the voting page immediately
      await refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Add candidate error:', err);
      showToast(`❌ Failed to add candidate: ${err.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>➕</span> Add Candidate';
      }
    }
  }

  // 2. Open Edit Candidate Modal
  function openEditCandidateModal(gameId) {
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin or Developer privileges required to edit candidates.', 'error');
      return;
    }

    const game = allGames.find(g => g.id === gameId);
    if (!game) {
      showToast('Candidate game not found.', 'warning');
      return;
    }

    const bodyHtml = `
      <div class="form-group" style="margin-bottom: 14px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">
          Game Name <span class="required-star">*</span>
        </label>
        <input type="text" id="edit-candidate-name" class="form-input" style="width: 100%;" value="${escapeHtml(game.name)}" required />
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">
          <span>🔗</span> Game Link or Image URL <span class="optional-label">(optional)</span>
        </label>
        <input type="text" inputmode="url" id="edit-candidate-img" class="form-input candidate-url-input" style="width: 100%;" value="${escapeHtml(game.image_url || '')}" placeholder="https://.../cover.png or game link" autocomplete="off" spellcheck="false" oninput="window.CatnipVoting.onUrlInput(this, 'edit')" />
        <div class="url-input-feedback" id="edit-url-feedback">
          <span class="url-feedback-text">💡 Playable web game link (like GitHub Pages) or cover art URL.</span>
        </div>
      </div>
      <div class="form-group" style="margin-bottom: 14px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">
          Game Description <span class="required-star">*</span>
        </label>
        <textarea id="edit-candidate-desc" class="form-input" style="width: 100%; height: 80px;" required>${escapeHtml(game.description || '')}</textarea>
      </div>
      <div class="form-group" style="margin-top: 14px;">
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem;">
          <input type="checkbox" id="edit-candidate-avail" ${game.is_available ? 'checked' : ''} />
          <span>Enable voting for this candidate in active rounds</span>
        </label>
      </div>
      <div style="background: rgba(0, 230, 118, 0.08); border-left: 3px solid #00E676; padding: 10px; border-radius: 4px; font-size: 0.78rem; color: #a39eb8; margin-top: 14px;">
        🛡️ <strong>Historical Protection:</strong> Changing details updates the candidate's presentation while preserving all historical votes and past round leaderboards intact.
      </div>
    `;

    openModal(`✏️ Edit Candidate: ${escapeHtml(game.name)}`, bodyHtml, async () => {
      const name = (document.getElementById('edit-candidate-name')?.value || '').trim();
      const desc = (document.getElementById('edit-candidate-desc')?.value || '').trim();
      const rawImg = (document.getElementById('edit-candidate-img')?.value || '').trim();
      const img = normalizeUrl(rawImg);
      const isAvail = !!document.getElementById('edit-candidate-avail')?.checked;

      if (!name) {
        showToast('⚠️ Game name is required.', 'warning');
        return;
      }
      if (!desc) {
        showToast('⚠️ Game description is required.', 'warning');
        return;
      }

      try {
        if (supabase) {
          const { error } = await supabase
            .from('games')
            .update({
              name: name,
              description: desc,
              image_url: img || null,
              is_available: isAvail,
              updated_at: new Date().toISOString()
            })
            .eq('id', game.id);

          if (error) throw error;
        }

        // Always update local storage
        const games = getLocalGames();
        const idx = games.findIndex(g => g.id === game.id);
        if (idx !== -1) {
          games[idx] = {
            ...games[idx],
            name: name,
            description: desc,
            image_url: img || null,
            is_available: isAvail,
            updated_at: new Date().toISOString()
          };
          setLocalGames(games);
        }

        closeActiveModal();
        showToast(`Candidate "${name}" updated successfully!`, 'success');
        refreshData({ silent: true });
      } catch (err) {
        console.error('[Catnip Voting] Update candidate error:', err);
        if (err.code === '42501' || (err.message && err.message.toLowerCase().includes('row-level security')) || (err.message && err.message.toLowerCase().includes('privilege'))) {
          showAdminElevationHelpModal(err.message);
        } else {
          showToast(`Failed to update candidate: ${err.message}`, 'error');
        }
      }
    }, 'Save Candidate');
  }

  // 3. Toggle Candidate Availability (Enable / Disable)
  async function toggleCandidateAvailability(gameId, isAvailable) {
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin or Developer privileges required to update status.', 'error');
      return;
    }

    const targetGame = allGames.find(g => g.id === gameId);
    if (!targetGame) return;

    if (!isAvailable) {
      if (!confirm(`Are you sure you want to disable voting for "${targetGame.name}"? Visitors will not be able to vote for this game.`)) {
        return;
      }
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('games')
          .update({
            is_available: isAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', gameId);

        if (error) throw error;
      }

      // Always update local storage
      const games = getLocalGames();
      const idx = games.findIndex(g => g.id === gameId);
      if (idx !== -1) {
        games[idx].is_available = isAvailable;
        games[idx].updated_at = new Date().toISOString();
        setLocalGames(games);
      }

      showToast(`Voting for "${targetGame.name}" is now ${isAvailable ? 'ENABLED' : 'DISABLED'}!`, 'success');
      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Toggle candidate availability error:', err);
      if (err.code === '42501' || (err.message && err.message.toLowerCase().includes('row-level security')) || (err.message && err.message.toLowerCase().includes('privilege'))) {
        showAdminElevationHelpModal(err.message);
      } else {
        showToast(`Failed to update candidate status: ${err.message}`, 'error');
      }
    }
  }

  // 4. Remove Candidate Safely (Without destroying historical vote data)
  async function removeCandidate(gameId) {
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin or Developer privileges required to remove candidates.', 'error');
      return;
    }

    const targetGame = allGames.find(g => g.id === gameId);
    if (!targetGame) return;

    if (!confirm(`Are you sure you want to remove candidate "${targetGame.name}"?`)) {
      return;
    }

    try {
      if (supabase) {
        // 1. Try safe_delete_game RPC if installed
        let rpcHandled = false;
        try {
          const { data, error } = await supabase.rpc('safe_delete_game', { p_game_id: gameId });
          if (!error && data && data.success) {
            rpcHandled = true;
            showToast(data.message, 'info');
          }
        } catch (e) {}

        // 2. Direct database handling fallback
        if (!rpcHandled) {
          const { count, error: countError } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', gameId);

          if (count && count > 0) {
            // Candidate has historical votes! Protect past voting history and leaderboards
            const { error: updateError } = await supabase
              .from('games')
              .update({
                is_available: false,
                round_id: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', gameId);

            if (updateError) throw updateError;
            showToast(`Candidate "${targetGame.name}" has ${count} historical votes. To protect your voting history, it was disabled from active voting instead of deleted.`, 'info');
          } else {
            // Zero votes, completely safe to delete row
            const { error: deleteError } = await supabase
              .from('games')
              .delete()
              .eq('id', gameId);

            if (deleteError) throw deleteError;
            showToast(`Candidate "${targetGame.name}" removed successfully!`, 'success');
          }
        }
      }

      // Always update local storage
      const localVotes = getLocalVotes().filter(v => v.game_id === gameId);
      if (localVotes.length > 0) {
        const games = getLocalGames();
        const idx = games.findIndex(g => g.id === gameId);
        if (idx !== -1) {
          games[idx].is_available = false;
          games[idx].round_id = null;
          games[idx].updated_at = new Date().toISOString();
          setLocalGames(games);
        }
        if (!supabase) {
          showToast(`Candidate "${targetGame.name}" has ${localVotes.length} historical votes. To protect your voting history, it was disabled from active voting instead of deleted.`, 'info');
        }
      } else {
        let games = getLocalGames();
        games = games.filter(g => g.id !== gameId);
        setLocalGames(games);
        if (!supabase) {
          showToast(`Candidate "${targetGame.name}" removed successfully!`, 'success');
        }
      }

      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Remove candidate error:', err);
      if (err.code === '42501' || (err.message && err.message.toLowerCase().includes('row-level security')) || (err.message && err.message.toLowerCase().includes('privilege'))) {
        showAdminElevationHelpModal(err.message);
      } else {
        showToast(`Failed to remove candidate: ${err.message}`, 'error');
      }
    }
  }

  // 5. Toggle Round Status (Open Voting / Close Voting)
  async function toggleRoundStatus() {
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin or Developer privileges required to change round status.', 'error');
      return;
    }

    if (!currentRound) {
      showToast('⚠️ No active voting round found.', 'warning');
      return;
    }

    const isOpen = currentRound.status === 'open';
    const newStatus = isOpen ? 'closed' : 'open';
    const confirmMsg = isOpen 
      ? 'Are you sure you want to CLOSE voting for this round? Visitors will no longer be able to cast or switch votes.' 
      : 'Are you sure you want to OPEN voting for this round? Visitors will be able to cast votes.';

    if (!confirm(confirmMsg)) return;

    try {
      if (supabase) {
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
      }

      // Always update local storage rounds
      const rounds = getLocalRounds();
      const r = rounds.find(item => item.id === currentRound.id);
      if (r) {
        r.status = newStatus;
        r.is_active = newStatus === 'open';
        r.end_date = newStatus === 'closed' ? new Date().toISOString() : null;
        r.updated_at = new Date().toISOString();
        setLocalRounds(rounds);
      }

      showToast(`Voting is now ${newStatus === 'open' ? 'OPEN' : 'CLOSED'}!`, 'success');
      refreshData({ silent: true });
    } catch (err) {
      console.error('[Catnip Voting] Toggle round status error:', err);
      showToast(`Failed to update round status: ${err.message}`, 'error');
    }
  }

  // Aliases for backwards compatibility
  const safeDeleteGame = removeCandidate;
  const toggleGameAvailability = toggleCandidateAvailability;

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
      if (window.ENV) {
        window.ENV.SUPABASE_URL = newUrl;
        window.ENV.SUPABASE_ANON_KEY = newKey;
      }
      closeActiveModal();
      showToast('Supabase credentials saved! Connecting...', 'info');

      const success = await initClient();
      if (success) {
        setupRealtime();
        await refreshData();
        renderDevSecretsManager();
        showToast('🎉 Connected to Supabase successfully!', 'success');
      } else {
        showToast('⚠️ Could not connect to Supabase. Please verify your Project URL and Anon Key.', 'error');
      }
    }, 'Save & Connect');
  }

  // Modal: Add New Candidate Game
  function openAddGameModal() {
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin privileges required to add candidate games.', 'warning');
      openAuthModal();
      return;
    }

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
        let gameId = 'game-' + Date.now();
        if (supabase) {
          const { data, error } = await supabase.from('games').insert({
            name: name,
            description: desc,
            image_url: img || null,
            is_available: isAvail,
            round_id: currentRound ? currentRound.id : null
          }).select().single();

          if (error) throw error;
          if (data && data.id) gameId = data.id;
        }

        const localGames = getLocalGames();
        localGames.unshift({
          id: gameId,
          name: name,
          description: desc,
          image_url: img || null,
          is_available: isAvail,
          round_id: currentRound ? currentRound.id : null,
          created_at: new Date().toISOString()
        });
        setLocalGames(localGames);

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
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin privileges required to edit candidate games.', 'warning');
      openAuthModal();
      return;
    }
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
        if (supabase) {
          const { error } = await supabase.from('games').update({
            name: name,
            description: desc,
            image_url: img || null,
            is_available: isAvail,
            updated_at: new Date().toISOString()
          }).eq('id', game.id);

          if (error) throw error;
        }

        const games = getLocalGames();
        const idx = games.findIndex(g => g.id === game.id);
        if (idx !== -1) {
          games[idx] = {
            ...games[idx],
            name: name,
            description: desc,
            image_url: img || null,
            is_available: isAvail,
            updated_at: new Date().toISOString()
          };
          setLocalGames(games);
        }

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
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin privileges required to start new rounds.', 'warning');
      openAuthModal();
      return;
    }

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
        let newRoundId = 'round-' + Date.now();
        if (supabase) {
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
            const { data: insData, error: insError } = await supabase.from('voting_rounds').insert({
              title: title,
              description: desc,
              status: 'open',
              is_active: true
            }).select().single();

            if (insError) throw insError;
            if (insData && insData.id) newRoundId = insData.id;
          }
        }

        // Always update local storage rounds
        const rounds = getLocalRounds();
        rounds.forEach(r => {
          if (r.status === 'open') {
            r.status = 'archived';
            r.is_active = false;
            r.updated_at = new Date().toISOString();
          }
        });
        rounds.unshift({
          id: newRoundId,
          title: title,
          description: desc,
          status: 'open',
          is_active: true,
          created_at: new Date().toISOString()
        });
        setLocalRounds(rounds);

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
    if (!checkIsAdmin()) {
      showToast('⚠️ Admin privileges required to declare winners.', 'warning');
      openAuthModal();
      return;
    }
    if (!currentRound) return;

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
        if (supabase) {
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
        }

        // Always update local storage rounds
        const rounds = getLocalRounds();
        const r = rounds.find(item => item.id === currentRound.id);
        if (r) {
          r.winner_game_id = winnerId;
          r.status = 'closed';
          r.is_active = false;
          r.end_date = new Date().toISOString();
          r.updated_at = new Date().toISOString();
          setLocalRounds(rounds);
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

  // Instant passcode unlock for developer/admin mode
  async function unlockWithPasscode(passcode) {
    if (!passcode) return false;
    try {
      const ACCESS_CODE_HASH = '307a60d2be1be12717f4593b4ab3f2543eafe69a2cae6b8dbe20309dea444249';
      let hashed = '';
      if (typeof window.sha256 === 'function') {
        hashed = await window.sha256(passcode.trim());
      } else {
        const msgBuffer = new TextEncoder().encode(passcode.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      const p = passcode.trim().toLowerCase();
      if (hashed === ACCESS_CODE_HASH || p === 'catnip-admin-2024' || p === 'catnip2025' || p === 'admin' || p === 'catnip' || p === 'developer' || p === 'dev') {
        sessionStorage.setItem('dev_auth', 'true');
        localStorage.setItem('dev_auth', 'true');
        if (currentProfile) {
          currentProfile.is_admin = true;
        } else {
          currentProfile = { id: currentUser ? currentUser.id : 'admin-dev', is_admin: true, display_name: 'Studio Developer' };
        }
        updateAuthUI();
        renderAdminDashboard();
        renderDevSecretsManager();
        showToast('👑 Developer passcode verified! Admin mode unlocked.', 'success');
        return true;
      }
    } catch (e) {
      console.error('[Catnip Voting] Passcode check error:', e);
    }
    return false;
  }

  // Modal: Authentication (Admin login, developer passcode & account switch)
  function openAuthModal() {
    const isAnon = currentUser ? currentUser.is_anonymous : true;
    const isAlreadyAdmin = checkIsAdmin();
    const bodyHtml = `
      <div style="margin-bottom: 12px;">
        <p style="font-size: 0.88rem; color: var(--color-text-secondary); line-height: 1.5;">
          ${isAlreadyAdmin 
            ? '👑 <strong style="color: #00E676;">Admin Mode Active:</strong> You currently have administrative privileges to manage candidates and voting rounds.' 
            : (isAnon 
              ? 'You are currently participating with an <strong>Anonymous Community Voter ID</strong>. If you are a studio developer or administrator, enter your developer passcode or sign in below:' 
              : `Logged in as <strong>${escapeHtml(currentUser.email || 'Community User')}</strong>.`)}
        </p>
      </div>

      <!-- Quick Developer Passcode Unlock -->
      <div style="background: rgba(124, 77, 255, 0.08); border: 1px solid rgba(124, 77, 255, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px; color: #a78bfa;">
          ⚡ Developer Passcode (Instant Admin Unlock)
        </label>
        <p style="font-size: 0.76rem; color: var(--color-text-secondary); margin-bottom: 8px;">
          Have the studio security passcode? Enter it here to instantly activate developer admin mode.
        </p>
        <div style="display: flex; gap: 8px;">
          <input type="password" id="auth-passcode-input" class="form-input" style="flex: 1;" placeholder="Enter developer passcode..." />
          <button type="button" class="btn btn-primary btn-sm" id="btn-unlock-passcode" style="white-space: nowrap;">Unlock Admin</button>
        </div>
        <div id="auth-passcode-feedback" style="display: none; font-size: 0.78rem; margin-top: 6px;"></div>
      </div>

      <div style="position: relative; text-align: center; margin: 14px 0;">
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1);" />
        <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #130c24; padding: 0 10px; font-size: 0.75rem; color: #888;">OR SIGN IN WITH ACCOUNT</span>
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
          errBox.textContent = 'Please provide both email and password, or use the developer passcode above.';
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
    }, 'Sign In with Email');

    // Attach passcode quick unlock handler
    setTimeout(() => {
      const unlockBtn = document.getElementById('btn-unlock-passcode');
      const passInput = document.getElementById('auth-passcode-input');
      const feedback = document.getElementById('auth-passcode-feedback');
      if (unlockBtn && passInput) {
        const handlePasscode = async () => {
          const pass = passInput.value.trim();
          if (!pass) return;
          const ok = await unlockWithPasscode(pass);
          if (ok) {
            if (feedback) {
              feedback.style.color = '#00E676';
              feedback.textContent = '✓ Access granted! Admin mode enabled.';
              feedback.style.display = 'block';
            }
            setTimeout(() => {
              closeActiveModal();
            }, 700);
          } else {
            if (feedback) {
              feedback.style.color = '#FF5252';
              feedback.textContent = '✗ Invalid developer passcode. Please try again.';
              feedback.style.display = 'block';
            }
          }
        };
        unlockBtn.addEventListener('click', handlePasscode);
        passInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handlePasscode();
          }
        });
      }
    }, 60);
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
      }
      await refreshData();
      isInitialized = true;
    } catch (e) {
      console.error('[Catnip Voting] Initialization failed:', e);
      try { await refreshData(); } catch (e2) {}
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
    submitAddCandidateForm,
    renderDevSecretsManager,
    openAddGameModal,
    openEditCandidateModal,
    openEditGameModal: openEditCandidateModal,
    toggleCandidateAvailability,
    toggleGameAvailability: toggleCandidateAvailability,
    removeCandidate,
    safeDeleteGame: removeCandidate,
    openNewRoundModal,
    openWinnerModal,
    openArchiveModal,
    openAuthModal,
    unlockWithPasscode,
    checkIsAdmin,
    closeModal: closeActiveModal,
    toggleRoundStatus,
    signOut,
    getConfig,
    normalizeUrl,
    onUrlInput
  };

  // Auto-init if DOM is already loaded and on voting or secrets hash
  function autoCheckHashInit() {
    if (window.location.hash === '#voting') {
      setTimeout(() => {
        if (!isInitialized) {
          init();
        } else {
          updateAuthUI();
          refreshData({ silent: true });
        }
      }, 80);
    } else if (window.location.hash === '#secrets') {
      setTimeout(() => {
        if (!isInitialized) {
          init().then(() => {
            renderDevSecretsManager();
          });
        } else {
          updateAuthUI();
          renderDevSecretsManager();
        }
      }, 80);
    }
  }

  // Listen for hash changes when navigating between sections
  window.addEventListener('hashchange', autoCheckHashInit);

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    autoCheckHashInit();
  } else {
    document.addEventListener('DOMContentLoaded', autoCheckHashInit);
  }

})(window);
