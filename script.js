/**
 * Catnip Studios Web and Wiki
 * Client-Side JavaScript Logic
 */

window.onerror = function(message, source, lineno, colno, error) {
  alert("JavaScript Exception: " + message + " (Line " + lineno + ", Col " + colno + ")");
  return false;
};

window.updateChestUI = function() {
  if (typeof window.updateQuestsUI === 'function') {
    window.updateQuestsUI();
  }
};

document.addEventListener('DOMContentLoaded', () => {

  const fullUrlStr = window.location.href;
  if (fullUrlStr.includes('unlock_honeypot=true')) {
    localStorage.removeItem('scw_lockdown_active');
    const cleanUrl = fullUrlStr.replace(/[?&]unlock_honeypot=true/, '');
    window.history.replaceState({path: cleanUrl}, '', cleanUrl);
    alert("🔓 Security Bypass:\nYou are free... don't try hacking again!");
  }

  if (localStorage.getItem('scw_lockdown_active') === 'true') {
    showLockdownScreen();
  }

  // Firebase Configuration Object (declared at the top to avoid TDZ issues)
  const firebaseConfig = {
    apiKey: "AIzaSy_CATNIP_STUDIOS_FIREBASE_KEY",
    authDomain: "catnip-studios-web.firebaseapp.com",
    projectId: "catnip-studios-web",
    storageBucket: "catnip-studios-web.appspot.com",
    messagingSenderId: "109876543210",
    appId: "1:109876543210:web:catnipweb000111"
  };
  let firebase = typeof window !== 'undefined' ? window.firebase : undefined;
  const isMockKey = firebaseConfig.apiKey === "AIzaSy_CATNIP_STUDIOS_FIREBASE_KEY";
  if (isMockKey) {
    firebase = undefined;
  }

  // ==================== STATE VARIABLES ====================
  let currentSection = 'home';
  let activeWikiCategory = 'all';
  let wikiSearchQuery = '';
  let lockTimerInterval = null;

  // ==================== CATNIP COINS & SHOP ENGINE STATE ====================
  let userCoins = 0;
  let ownedItems = [];
  let activeCosmetics = [];
  let lastClaimTimestamp = 0;
  let activeCauRole = '';
  let activeCauExtraCats = 0;
  let bankDepositAmount = 0;
  let bankDepositTimestamp = 0;

  // Mix and Match Avatar & Profiles Customs System
  let avatarCat = 'cat_basic';
  let avatarExpression = 'expr_happy';
  let avatarFrame = 'frame_none';
  let unlockedCats = ["cat_basic", "cat_orange", "cat_black", "cat_white", "cat_tuxedo", "cat_brown", "cat_calico", "cat_grey", "cat_siamese"];
  let unlockedFrames = ["frame_none"];
  let joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let totalCoinsEarned = 0;
  let gamesPlayed = 0;
  let victoryCount = 0;
  let favouriteGame = 'Super Smash Cats';
  let achievements = [];
  let ratKillsCount = 0;
  let wikiPagesRead = 0;
  let hoursPlayed = 14.2;
  let journalStreak = 3;
  let loginStreak = 5;
  let coinsSpent = 0;
  let activeTitle = '';
  let unlockedTitles = [];
  let userXP = 0;
  let userLevel = 1;
  let userPrestige = 0;

  // Seasonal Events State variables
  let activeEvent = 'none';
  let overrideEventSetting = 'auto'; // 'auto', 'none', 'halloween', 'winter', 'spring', 'anniversary'

  const QUESTS_DATABASE = [
    // Super Smash Cats (smash)
    { id: 'smash_rats_5', text: 'Defeat 5 Rats in Super Smash Cats', target: 5, reward: 20, type: 'smash_rats', isRare: false },
    { id: 'smash_rats_15', text: 'Defeat 15 Rats in Super Smash Cats', target: 15, reward: 30, type: 'smash_rats', isRare: false },
    { id: 'smash_win_1', text: 'Win 1 Super Smash Cats match', target: 1, reward: 25, type: 'smash_win', isRare: false },
    { id: 'smash_win_3', text: 'Win 3 Super Smash Cats matches', target: 3, reward: 40, type: 'smash_win', isRare: false },
    { id: 'smash_attacks_20', text: 'Perform 20 attacks in Super Smash Cats', target: 20, reward: 20, type: 'smash_attacks', isRare: false },
    { id: 'smash_king_1', text: 'Defeat the Rat King in Super Smash Cats', target: 1, reward: 35, type: 'smash_boss', isRare: false },
    { id: 'smash_jumps_50', text: 'Jump 50 times in Super Smash Cats', target: 50, reward: 20, type: 'smash_jumps', isRare: false },
    { id: 'smash_play_2', text: 'Play 2 Super Smash Cats matches', target: 2, reward: 20, type: 'smash_play', isRare: false },

    // Cats Among Us (among_us)
    { id: 'among_play_1', text: 'Complete 1 game of Cats Among Us', target: 1, reward: 20, type: 'among_play', isRare: false },
    { id: 'among_play_3', text: 'Complete 3 games of Cats Among Us', target: 3, reward: 40, type: 'among_play', isRare: false },
    { id: 'among_win_captain', text: 'Win as Captain in Cats Among Us', target: 1, reward: 30, type: 'among_win', isRare: false },
    { id: 'among_win_guard', text: 'Win as Guard in Cats Among Us', target: 1, reward: 30, type: 'among_win', isRare: false },
    { id: 'among_win_engineer', text: 'Win as Engineer in Cats Among Us', target: 1, reward: 30, type: 'among_win', isRare: false },
    { id: 'among_win_medic', text: 'Win as Medic in Cats Among Us', target: 1, reward: 30, type: 'among_win', isRare: false },
    { id: 'among_win_innocent', text: 'Win as Innocent in Cats Among Us', target: 1, reward: 25, type: 'among_win', isRare: false },
    { id: 'among_win_detective', text: 'Win as Detective in Cats Among Us', target: 1, reward: 30, type: 'among_win', isRare: false },
    { id: 'among_win_impostor', text: 'Win as Impostor in Cats Among Us', target: 1, reward: 35, type: 'among_win', isRare: false },

    // Super Cat World (scw)
    { id: 'scw_exchange_50', text: 'Exchange 50 SCW Coins', target: 50, reward: 20, type: 'scw_exchange', isRare: false },
    { id: 'scw_exchange_100', text: 'Exchange 100 SCW Coins', target: 100, reward: 30, type: 'scw_exchange', isRare: false },
    { id: 'scw_exchange_250', text: 'Exchange 250 SCW Coins', target: 250, reward: 50, type: 'scw_exchange', isRare: false },
    { id: 'scw_visit_terminal', text: 'Visit the Coin Exchange Terminal', target: 1, reward: 15, type: 'scw_terminal', isRare: false },
    { id: 'scw_import_coins', text: 'Import coins from one level', target: 1, reward: 20, type: 'scw_import', isRare: false },

    // Wiki (wiki)
    { id: 'wiki_read_3', text: 'Read 3 wiki articles', target: 3, reward: 20, type: 'wiki_read', isRare: false },
    { id: 'wiki_read_10', text: 'Read 10 wiki articles', target: 10, reward: 40, type: 'wiki_read', isRare: false },
    { id: 'wiki_search', text: 'Search for an article on the wiki', target: 1, reward: 15, type: 'wiki_search', isRare: false },
    { id: 'wiki_lore', text: 'Read a lore book article', target: 1, reward: 15, type: 'wiki_lore', isRare: false },
    { id: 'wiki_character', text: 'Read about a character in the wiki', target: 1, reward: 15, type: 'wiki_character', isRare: false },
    { id: 'wiki_location', text: 'Read about a location in the wiki', target: 1, reward: 15, type: 'wiki_location', isRare: false },
    { id: 'wiki_item', text: 'Read about an item in the wiki', target: 1, reward: 15, type: 'wiki_item', isRare: false },

    // Journal (journal)
    { id: 'journal_write_today', text: "Write today's journal", target: 1, reward: 20, type: 'journal_write', isRare: false },
    { id: 'journal_chars_100', text: 'Write a journal with at least 100 characters', target: 1, reward: 25, type: 'journal_chars', isRare: false },
    { id: 'journal_mention_game', text: 'Mention one game you played today in journal', target: 1, reward: 20, type: 'journal_mention', isRare: false },

    // Shop & Economy (shop)
    { id: 'shop_earn_100', text: 'Earn 100 Catnip Coins', target: 100, reward: 20, type: 'shop_earn', isRare: false },
    { id: 'shop_spend_50', text: 'Spend 50 Catnip Coins', target: 50, reward: 20, type: 'shop_spend', isRare: false },
    { id: 'shop_buy_cosmetic', text: 'Buy one cosmetic item from the shop', target: 1, reward: 25, type: 'shop_buy', isRare: false },
    { id: 'shop_open_chest', text: 'Open a Mystery Gachapon Chest', target: 1, reward: 20, type: 'shop_chest', isRare: false },

    // General Hub (hub)
    { id: 'hub_login', text: 'Log in today', target: 1, reward: 15, type: 'hub_login', isRare: false },
    { id: 'hub_visit_3_games', text: 'Visit all three game pages', target: 3, reward: 25, type: 'hub_visit_games', isRare: false },
    { id: 'hub_view_leaderboard', text: 'View the speedrun leaderboard', target: 1, reward: 15, type: 'hub_leaderboard', isRare: false },
    { id: 'hub_customise', text: 'Customise your profile or equip cosmetic', target: 1, reward: 15, type: 'hub_customise', isRare: false },

    // Rare Daily Quests (rare)
    { id: 'rare_defeat_100_rats', text: 'Defeat 100 Rats in Super Smash Cats', target: 100, reward: 80, type: 'smash_rats', isRare: true },
    { id: 'rare_win_5_smash', text: 'Win 5 Super Smash Cats matches', target: 5, reward: 90, type: 'smash_win', isRare: true },
    { id: 'rare_read_all_new', text: 'Read every new wiki article today', target: 3, reward: 70, type: 'wiki_read_all', isRare: true },
    { id: 'rare_earn_500_coins', text: 'Earn 500 Catnip Coins', target: 500, reward: 100, type: 'shop_earn', isRare: true },
    { id: 'rare_open_3_chests', text: 'Open 3 Mystery Chests', target: 3, reward: 80, type: 'shop_chest_rare', isRare: true },
    { id: 'rare_streak_7_login', text: 'Keep a 7-day login streak', target: 7, reward: 120, type: 'hub_login_streak', isRare: true },
    { id: 'rare_beat_all_bosses', text: 'Beat every available brawler boss today', target: 3, reward: 110, type: 'smash_boss_all', isRare: true },
    { id: 'rare_visit_hub_5', text: 'Visit the hub five different times in one day', target: 5, reward: 60, type: 'hub_visits', isRare: true },
    { id: 'rare_complete_all_dailies', text: 'Complete every daily quest today', target: 3, reward: 100, type: 'hub_quests_all', isRare: true },
    { id: 'rare_easter_egg', text: 'Help discover a hidden easter egg', target: 1, reward: 80, type: 'hub_easter_egg', isRare: true }
  ];

  const catsData = [
    { id: 'cat_basic', emoji: '🐱', name: 'Basic Cat', type: 'basic', cost: 0 },
    { id: 'cat_orange', emoji: '🟠', name: 'Orange Tabby', type: 'basic', cost: 0 },
    { id: 'cat_black', emoji: '⚫', name: 'Black Cat', type: 'basic', cost: 0 },
    { id: 'cat_white', emoji: '⚪', name: 'White Cat', type: 'basic', cost: 0 },
    { id: 'cat_tuxedo', emoji: '⚪⚫', name: 'Tuxedo Cat', type: 'basic', cost: 0 },
    { id: 'cat_brown', emoji: '🟤', name: 'Brown Tabby', type: 'basic', cost: 0 },
    { id: 'cat_calico', emoji: '🧡', name: 'Calico', type: 'basic', cost: 0 },
    { id: 'cat_grey', emoji: '🩶', name: 'Grey Cat', type: 'basic', cost: 0 },
    { id: 'cat_siamese', emoji: '🤍', name: 'Siamese Cat', type: 'basic', cost: 0 },
    { id: 'cat_king', emoji: '👑', name: 'King Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_robot', emoji: '🤖', name: 'Robot Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_ghost', emoji: '👻', name: 'Ghost Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_wizard', emoji: '🧙', name: 'Wizard Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_pirate', emoji: '🏴‍☠️', name: 'Pirate Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_knight', emoji: '🛡️', name: 'Knight Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_galaxy', emoji: '🌌', name: 'Galaxy Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_electric', emoji: '⚡', name: 'Electric Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_ice', emoji: '❄️', name: 'Ice Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_fire', emoji: '🔥', name: 'Fire Cat', type: 'unlockable', cost: 150 },
    { id: 'cat_xp_emperor', emoji: '👑🐱', name: 'Emperor Cat (Milestone)', type: 'progression', cost: 0 },
    { id: 'cat_pumpkin', emoji: '🎃', name: 'Pumpkin Cat', type: 'event', cost: 200 },
    { id: 'cat_santa', emoji: '🎅', name: 'Santa Cat', type: 'event', cost: 200 },
    { id: 'cat_bunny', emoji: '🐰', name: 'Bunny Cat', type: 'event', cost: 200 },
    { id: 'cat_valentine', emoji: '❤️', name: 'Valentine Cat', type: 'event', cost: 200 },
    { id: 'cat_rainbow', emoji: '🌈', name: 'Rainbow Cat', type: 'event', cost: 200 },
    { id: 'cat_neon', emoji: '💜', name: 'Neon Cat', type: 'rare', cost: 300 },
    { id: 'cat_golden', emoji: '🌟', name: 'Golden Cat', type: 'rare', cost: 300 },
    { id: 'cat_crystal', emoji: '💎', name: 'Crystal Cat', type: 'rare', cost: 300 },
    { id: 'cat_moon', emoji: '🌙', name: 'Moon Cat', type: 'rare', cost: 300 },
    { id: 'cat_sun', emoji: '☀️', name: 'Sun Cat', type: 'rare', cost: 300 },
    { id: 'cat_god', emoji: '😺', name: 'God Cat', type: 'rare', cost: 300 },
    { id: 'cat_grumpy', emoji: '😾', name: 'Grumpy Cat', type: 'funny', cost: 120 },
    { id: 'cat_silly', emoji: '😸', name: 'Silly Cat', type: 'funny', cost: 120 },
    { id: 'cat_detective', emoji: '😼', name: 'Detective Cat', type: 'funny', cost: 120 },
    { id: 'cat_gamer', emoji: '😺', name: 'Gamer Cat', type: 'funny', cost: 120 },
    { id: 'cat_pizza', emoji: '🍕', name: 'Pizza Cat', type: 'funny', cost: 120 },
    { id: 'cat_fish', emoji: '🐟', name: 'Fish Lover Cat', type: 'funny', cost: 120 },
    { id: 'cat_sleepy', emoji: '😴', name: 'Sleepy Cat', type: 'funny', cost: 120 },
    { id: 'cat_scientist', emoji: '🥽', name: 'Scientist Cat', type: 'funny', cost: 120 },
    { id: 'cat_developer', emoji: '🧑‍💻', name: 'Developer Cat (Rare)', type: 'special', cost: 9999 },
    { id: 'halloween-ghost', emoji: '👻', name: 'Ghost Cat', type: 'event', cost: 250 },
    { id: 'winter-santa', emoji: '🎅', name: 'Santa Cat', type: 'event', cost: 250 },
    { id: 'spring-flower', emoji: '🌸', name: 'Flower Crown Cat', type: 'event', cost: 250 },
    { id: 'anniversary-party', emoji: '🥳', name: 'Party Hat Cat', type: 'event', cost: 250 }
  ];

  const framesData = [
    { id: 'frame_none', emoji: '⚪', name: 'No Frame', cost: 0, css: 'frame-none' },
    { id: 'frame_neon_purple', emoji: '🟣', name: 'Neon Purple', cost: 100, css: 'frame-neon-purple' },
    { id: 'frame_electric_blue', emoji: '🔵', name: 'Electric Blue', cost: 100, css: 'frame-electric-blue' },
    { id: 'frame_emerald', emoji: '🟢', name: 'Emerald', cost: 100, css: 'frame-emerald' },
    { id: 'frame_gold', emoji: '🟡', name: 'Gold', cost: 100, css: 'frame-gold' },
    { id: 'frame_ruby', emoji: '🔴', name: 'Ruby', cost: 100, css: 'frame-ruby' },
    { id: 'frame_rainbow', emoji: '🌈', name: 'Rainbow (Anim)', cost: 250, css: 'frame-rainbow' },
    { id: 'frame_electric_sparks', emoji: '⚡', name: 'Sparks (Anim)', cost: 250, css: 'frame-electric-sparks' },
    { id: 'frame_snowflakes', emoji: '❄️', name: 'Snow (Anim)', cost: 250, css: 'frame-snowflakes' },
    { id: 'frame_flames', emoji: '🔥', name: 'Flames (Anim)', cost: 250, css: 'frame-flames' },
    { id: 'frame_floating_stars', emoji: '⭐', name: 'Stars (Anim)', cost: 250, css: 'frame-floating-stars' },
    { id: 'halloween-web', emoji: '🕷️', name: 'Spooky Web (Anim)', cost: 200, css: 'frame-halloween-web' },
    { id: 'winter-candy', emoji: '🍬', name: 'Candy Cane (Anim)', cost: 200, css: 'frame-winter-candy' },
    { id: 'spring-vines', emoji: '🌿', name: 'Vines (Anim)', cost: 200, css: 'frame-spring-vines' },
    { id: 'anniversary-confetti', emoji: '🎉', name: 'Confetti (Anim)', cost: 200, css: 'frame-anniversary-confetti' },
    { id: 'frame_developer', emoji: '🛠️', name: 'Developer Border (Rare)', cost: 9999, css: 'frame-developer' }
  ];

  // ==================== XP & LEVEL PROGRESSION SYSTEM ====================
  const TITLES_DATABASE = [
    { title: 'Curious Kitten 🐾', level: 1 },
    { title: 'Alley Cat 🐱', level: 5 },
    { title: 'Rat Chaser ⚔', level: 10 },
    { title: 'Cat Adventurer 🗺', level: 15 },
    { title: 'Cat Hero ⭐', level: 20 },
    { title: '🐷 Legend of the Blade 👑', level: 20 }, // Special pink title!
    { title: 'Cat Champion 🏆', level: 30 },
    { title: 'Cat Legend 🌟', level: 40 },
    { title: 'Cat Emperor 👑', level: 50 },
    { title: 'Galaxy Guardian 🌌', level: 75 },
    { title: 'Catnip Master 💜', level: 100 }
  ];

  const LEVEL_REWARDS = {
    2: { name: '💰 +100 Coins', coins: 100 },
    5: { name: '🤖 Robot Cat Avatar', avatar: 'cat_robot', coins: 0 },
    10: { name: '⚡ Sparks Animated Border', border: 'frame_electric_sparks', coins: 0 },
    15: { name: '🎁 Free Mystery Chest Crate', mysteryChest: true, coins: 0 },
    20: { name: '👑 Golden Name & 🐷 Legend of the Blade Title', nametag: 'golden_name', title: '🐷 Legend of the Blade 👑', coins: 500 },
    25: { name: '🏷️ "Alley Cat" Title', title: 'Alley Cat 🐱', coins: 0 },
    30: { name: '🧙 Wizard Cat Avatar', avatar: 'cat_wizard', coins: 0 },
    40: { name: '🌈 Rainbow Animated Border', border: 'frame_rainbow', coins: 0 },
    50: { name: '🔥 Emperor Cat Avatar + 1,000 Coins', avatar: 'cat_xp_emperor', coins: 1000 }
  };

  function getXPNeededForLevel(level) {
    if (level === 1) return 100;
    if (level === 2) return 150;
    if (level === 3) return 225;
    if (level === 4) return 340;
    return level * 100;
  }

  function getPrestigeBadge(prestige) {
    if (prestige === 0) return '';
    if (prestige === 1) return '🥉 Prestige I';
    if (prestige === 2) return '🥈 Prestige II';
    if (prestige === 3) return '🥇 Prestige III';
    if (prestige === 4) return '💎 Diamond Prestige';
    return '🌌 Cosmic Prestige';
  }

  function checkUnlockedTitles(level) {
    let updated = false;
    TITLES_DATABASE.forEach(item => {
      if (level >= item.level && !unlockedTitles.includes(item.title)) {
        unlockedTitles.push(item.title);
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem('scw_unlocked_titles', JSON.stringify(unlockedTitles));
    }
  }

  function populateTitleDropdown() {
    const select = document.getElementById('profile-title-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">No Title Selected</option>';
    
    unlockedTitles.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === activeTitle) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  function addXP(amount) {
    if (typeof amount !== 'number' || amount <= 0) return;
    
    userXP += amount;
    
    let leveledUp = false;
    let newLevel = userLevel;
    
    while (true) {
      const xpNeeded = getXPNeededForLevel(newLevel);
      if (userXP >= xpNeeded) {
        userXP -= xpNeeded;
        newLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }
    
    if (leveledUp) {
      const oldLevel = userLevel;
      userLevel = newLevel;
      checkUnlockedTitles(userLevel);
      processLevelUpRewards(oldLevel, userLevel);
    }
    
    saveCoinsToLocalStorage();
    syncCoinsToFirestore();
    updateXPUI();
    showFloatingXPIndicator(amount);
  }

  window.addXP = addXP;

  function showFloatingXPIndicator(amount) {
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '100px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))';
    indicator.style.color = '#FFF';
    indicator.style.padding = '8px 16px';
    indicator.style.borderRadius = '20px';
    indicator.style.fontWeight = '800';
    indicator.style.fontSize = '0.9rem';
    indicator.style.boxShadow = '0 0 15px rgba(124, 77, 255, 0.4)';
    indicator.style.zIndex = '99999';
    indicator.style.pointerEvents = 'none';
    indicator.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    indicator.textContent = `+${amount} XP`;
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.style.transform = 'translate(-50%, -40px)';
      indicator.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
      indicator.remove();
    }, 850);
  }

  function processLevelUpRewards(oldLevel, newLevel) {
    let unlockedItemsText = [];
    let coinsRewarded = 0;
    
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      const reward = LEVEL_REWARDS[lvl];
      if (reward) {
        if (reward.coins > 0) {
          coinsRewarded += reward.coins;
          userCoins += reward.coins;
          totalCoinsEarned += reward.coins;
        }
        if (reward.avatar) {
          if (!unlockedCats.includes(reward.avatar)) {
            unlockedCats.push(reward.avatar);
            localStorage.setItem('scw_unlocked_cats', JSON.stringify(unlockedCats));
          }
          unlockedItemsText.push(`🐱 Avatar: ${reward.name}`);
        }
        if (reward.border) {
          if (!unlockedFrames.includes(reward.border)) {
            unlockedFrames.push(reward.border);
            localStorage.setItem('scw_unlocked_frames', JSON.stringify(unlockedFrames));
          }
          unlockedItemsText.push(`🖼️ Frame: ${reward.name}`);
        }
        if (reward.mysteryChest) {
          userCoins += 150;
          totalCoinsEarned += 150;
          unlockedItemsText.push(`🎁 1 Free Gachapon Chest Roll (+150 Coins credited)`);
        }
        if (reward.title) {
          if (!unlockedTitles.includes(reward.title)) {
            unlockedTitles.push(reward.title);
            localStorage.setItem('scw_unlocked_titles', JSON.stringify(unlockedTitles));
          }
          unlockedItemsText.push(`🏷️ Title: ${reward.title}`);
        }
        if (reward.nametag) {
          unlockedItemsText.push(`👑 Nametag style unlocked!`);
        }
      }
      
      if (!reward) {
        const standardReward = 50;
        coinsRewarded += standardReward;
        userCoins += standardReward;
        totalCoinsEarned += standardReward;
      }
    }
    
    if (coinsRewarded > 0) {
      unlockedItemsText.push(`💰 +${coinsRewarded} Catnip Coins`);
    }
    
    triggerLevelUpModalAnimation(newLevel, unlockedItemsText);
  }

  function drawCatPaw(ctx, x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = `rgba(124, 77, 255, ${opacity})`;
    
    ctx.beginPath();
    ctx.ellipse(0, 5, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const toeSpacing = [-0.6, -0.2, 0.2, 0.6];
    const toeHeights = [-3, -6, -6, -3];
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(toeSpacing[i] * size, toeHeights[i] * size * 0.8, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  function drawPinkSparkle(ctx, x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = `rgba(255, 128, 171, ${opacity})`;
    
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(0, -size);
      ctx.lineTo(size * 0.25, -size * 0.25);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function triggerLevelUpModalAnimation(level, rewardsList) {
    const modal = document.getElementById('level-up-modal');
    const levelNumDisplay = document.getElementById('levelup-level-num');
    const rewardDisplay = document.getElementById('levelup-reward-display');
    const canvas = document.getElementById('level-up-particles-canvas');
    const confirmBtn = document.getElementById('btn-levelup-confirm');
    
    if (!modal || !canvas) return;
    
    if (levelNumDisplay) levelNumDisplay.textContent = level;
    if (rewardDisplay) {
      rewardDisplay.innerHTML = '';
      if (rewardsList.length === 0) {
        rewardDisplay.innerHTML = '<div>🎉 Keep up the great adventure!</div>';
      } else {
        rewardsList.forEach(r => {
          const item = document.createElement('div');
          item.textContent = r;
          rewardDisplay.appendChild(item);
        });
      }
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    playRetroSound('victory');
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const particles = [];
    const isLevel20Tribute = (level === 20);
    const spawnCount = isLevel20Tribute ? 50 : 30;
    
    for (let i = 0; i < spawnCount; i++) {
      const type = (isLevel20Tribute && Math.random() < 0.6) ? 'sparkle' : 'paw';
      particles.push({
        type: type,
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: Math.random() * 2 - 1,
        vy: -(Math.random() * 2.5 + 1.2),
        size: type === 'sparkle' ? Math.random() * 6 + 4 : Math.random() * 8 + 6,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: Math.random() * 0.04 - 0.02,
        opacity: Math.random() * 0.4 + 0.5
      });
    }
    
    let active = true;
    
    const runParticles = () => {
      if (!active) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.0025;
        
        if (p.y < -30 || p.opacity <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 20;
          p.vy = -(Math.random() * 2.5 + 1.2);
          p.opacity = Math.random() * 0.4 + 0.5;
        }
        
        if (p.type === 'sparkle') {
          drawPinkSparkle(ctx, p.x, p.y, p.size, p.rotation, p.opacity);
        } else {
          drawCatPaw(ctx, p.x, p.y, p.size, p.rotation, p.opacity);
        }
      });
      
      requestAnimationFrame(runParticles);
    };
    
    requestAnimationFrame(runParticles);
    
    const closeLevelUp = () => {
      active = false;
      modal.style.display = 'none';
      document.body.style.overflow = '';
      playRetroSound('click');
      confirmBtn.removeEventListener('click', closeLevelUp);
    };
    
    confirmBtn.addEventListener('click', closeLevelUp);
  }

  function updateXPUI() {
    const xpNeeded = getXPNeededForLevel(userLevel);
    const xpPercent = Math.min(100, Math.max(0, (userXP / xpNeeded) * 100));
    const prestigeBadge = getPrestigeBadge(userPrestige);
    
    const headerPrestige = document.getElementById('header-prestige-badge');
    const headerLevel = document.getElementById('header-user-level');
    const headerXPBar = document.getElementById('header-xp-bar-fill');
    const headerXPText = document.getElementById('header-xp-text');
    
    if (headerPrestige) {
      headerPrestige.textContent = prestigeBadge ? prestigeBadge.split(' ')[0] : '';
    }
    if (headerLevel) headerLevel.textContent = userLevel;
    if (headerXPBar) headerXPBar.style.width = `${xpPercent}%`;
    if (headerXPText) headerXPText.textContent = `${userXP}/${xpNeeded} XP`;
    
    const profilePrestige = document.getElementById('profile-prestige-badge');
    const profileLevel = document.getElementById('profile-user-level');
    const profileXPBar = document.getElementById('profile-xp-bar-fill');
    const profileXPRatio = document.getElementById('profile-xp-ratio');
    const profileTitleLabel = document.getElementById('profile-display-title-label');
    
    if (profilePrestige) profilePrestige.textContent = prestigeBadge;
    if (profileLevel) profileLevel.textContent = userLevel;
    if (profileXPBar) profileXPBar.style.width = `${xpPercent}%`;
    if (profileXPRatio) profileXPRatio.textContent = `${userXP.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`;
    
    if (profileTitleLabel) {
      if (activeTitle) {
        profileTitleLabel.textContent = activeTitle;
        profileTitleLabel.style.display = 'inline-block';
        if (activeTitle.includes('Legend of the Blade')) {
          profileTitleLabel.className = 'title-tribute-blade';
          profileTitleLabel.title = "Technoblade (Tribute): Awarded in honour of Technoblade, whose creativity and humour inspired millions of Minecraft players.";
        } else {
          profileTitleLabel.className = '';
          profileTitleLabel.style.color = 'var(--color-primary)';
          profileTitleLabel.style.background = 'rgba(124, 77, 255, 0.12)';
          profileTitleLabel.style.borderColor = 'rgba(124, 77, 255, 0.25)';
          profileTitleLabel.title = '';
        }
      } else {
        profileTitleLabel.textContent = '';
        profileTitleLabel.style.display = 'none';
        profileTitleLabel.title = '';
      }
    }
    
    populateTitleDropdown();
    
    const prestigeContainer = document.getElementById('profile-prestige-container');
    if (prestigeContainer) {
      prestigeContainer.style.display = (userLevel >= 100) ? 'block' : 'none';
    }
  }

  window.updateXPUI = updateXPUI;

  const exprsData = [
    { id: 'expr_happy', emoji: '😀', name: 'Happy' },
    { id: 'expr_cool', emoji: '😎', name: 'Cool' },
    { id: 'expr_excited', emoji: '😺', name: 'Excited' },
    { id: 'expr_sleepy', emoji: '😴', name: 'Sleepy' },
    { id: 'expr_confident', emoji: '😼', name: 'Confident' },
    { id: 'expr_angry', emoji: '😾', name: 'Angry' },
    { id: 'expr_surprised', emoji: '😮', name: 'Surprised' },
    { id: 'expr_laughing', emoji: '😂', name: 'Laughing' },
    { id: 'expression-scared', emoji: '🙀', name: 'Scared' },
    { id: 'expression-frosty', emoji: '🥶', name: 'Frosty' },
    { id: 'expression-blossom', emoji: '🌸', name: 'Blossom' },
    { id: 'expression-exuberant', emoji: '🥳', name: 'Exuberant' }
  ];

  const wikiArticles = {
    'community-tributes': {
      title: 'Community Tributes',
      category: 'lore',
      tag: 'Tribute',
      image: '🐷',
      firstAppearance: 'July 2026',
      characters: 'Technoblade',
      quotes: ['Technoblade Never Dies!'],
      trivia: [
        "Unlocks the pink custom title '🐷 Legend of the Blade 👑' at Level 20.",
        "Awarded as a community tribute in honor of Technoblade's legacy in the gaming and Minecraft spaces."
      ],
      timeline: '<ul><li><strong>June 2022</strong> - In memory of Technoblade, who passed away after a brave battle with cancer.</li><li><strong>July 2026</strong> - Catnip Studios integrates community tributes to honor legendary gamers.</li></ul>',
      related: ['studio-history'],
      content: `
        <p>At Catnip Studios, we believe that games are built on the creativity, humor, and connection of the communities that play them. In this section, we pay tribute to outstanding community members and figures whose dedication has left a permanent legacy in gaming.</p>
        
        <h4 style="margin-top: 15px; margin-bottom: 8px; color: #ff80ab;">🐷 Tribute: Technoblade</h4>
        <p>Alexander, known online as <strong>Technoblade</strong>, was a legendary Minecraft content creator known for his brilliant wit, tactical gameplay, and deep passion. His catchphrases, humorous rivalries, and incredible charity events inspired millions of players around the world.</p>
        <p>This tribute title is a small, respectful nod from our community to celebrate his impact. It is completely independent and has no official connection or endorsement from his estate.</p>
      `
    },
    'bug-code-classifications': {
      title: 'Bug Code Classifications & Diagnostics Guide',
      category: 'mechanics',
      tag: 'Diagnostics',
      image: '👾',
      firstAppearance: 'Studio Diagnostics System (July 2026)',
      quotes: ['Quality control and classification metrics for all active projects.'],
      trivia: [
        "Code 0 signifies a completely bug-free state.",
        "Code 3: Big problem represents the most common blocker before game releases.",
        "Code 6: Discontinued is the newest diagnostic rating, added in July 2026."
      ],
      related: ['super-cat-world', 'super-smash-cats', 'cats-among-us', 'catnip-kingdom', 'catnip-kart'],
      content: `
        <p>The studio uses an internal bug classification metric to evaluate development health and stability across all projects. This system is now publicly visible to keep players informed on the active diagnostics of their favorite games.</p>
        
        <h4 style="margin-top: 15px; margin-bottom: 8px; color: var(--color-accent);">Diagnostic Classification Levels</h4>
        <ul style="padding-left: 20px; line-height: 1.6; display: flex; flex-direction: column; gap: 8px;">
          <li><strong>Code 0: Bug Free Status</strong> — No bugs detected. All major issues resolved.</li>
          <li><strong>Code 1: Small but annoying bug</strong> — Minor styling or audio glitches. Game is fully playable.</li>
          <li><strong>Code 2: Game Stopping Bug</strong> — Code faults prevent the game from compiling or running properly.</li>
          <li><strong>Code 3: Big Problem</strong> — Critical issues including game-stopping bugs and performance bottlenecks.</li>
          <li><strong>Code 4: 50% Cancelled Chance</strong> — High-risk bugs that jeopardize completion or stability.</li>
          <li><strong>Code 5: Doomed</strong> — Terminal failure state. Project is compromised.</li>
          <li><strong>Code 6: Discontinued</strong> — Official rating for projects whose development has been retired or shelved.</li>
        </ul>
      `
    },
    'super-cat-world': {
      title: 'Super Cat World',
      category: 'games',
      tag: 'Game',
      image: '🎮',
      firstAppearance: 'February 24, 2025',
      characters: 'Catnip, Clawz, Dreth, wisecat',
      quotes: ['Where platforming precision meets feline speed!'],
      trivia: [
        "The game's final world contains hidden levels referencing the 'Glitched Lands' prototype.",
        "Super Cat World was built in exactly two weeks during the winter vacation."
      ],
      timeline: '<ul><li><strong>Feb 2025</strong> - Development begins.</li><li><strong>Mar 2025</strong> - Public beta releases.</li><li><strong>July 2026</strong> - Permanent Global Speedrun Leaderboard added.</li></ul>',
      related: ['characters', 'mechanics', 'items-power-ups'],
      content: `
        <p><strong>Super Cat World</strong> is Catnip Studios' first game and platformer. The game centers around high-performance parkour platforming and challenging boss fights.</p>
        <h4>Game Details</h4>
        <p>Take control of your character and navigate complex 2D levels designed to test your reflexes and skill while preparing for epic boss showdowns.</p>
      `
    },
    'super-smash-cats': {
      title: 'Super Smash Cats',
      category: 'games',
      tag: 'Game',
      image: '💥',
      firstAppearance: 'April 15, 2025',
      characters: 'Allied Feline fighters',
      quotes: ['Fight for glory, fight for catnip!'],
      trivia: [
        "Designed to be the ultimate local-couch brawler for cats.",
        "Spinning yarn ball power-up was inspired by the developer's cat playing with real wool."
      ],
      timeline: '<ul><li><strong>Apr 2025</strong> - Brawler prototype released.</li><li><strong>June 2025</strong> - Co-op mode update.</li></ul>',
      related: ['super-cat-world', 'catnip-kart'],
      content: `
        <p><strong>Super Smash Cats</strong> is an action-packed, fast-paced multiplayer platform brawler. Felines from all nine realms gather in dangerous, multi-tiered combat arenas to fight for glory and Catnip Coins.</p>
        <h4>Gameplay & Combat Modes</h4>
        <p>Choose your cat breed and battle in local Player vs Player, Player vs Bot, or Online PvP room lobbies. Players execute attacks, shield blocks, and jumps to knock opponents out of the arena bounds.</p>
        <h4>⚔️ Arcade Campaign Mode</h4>
        <p>Take on the rodent armies in a multi-wave adventure mode! Face waves of custom rat enemies and defend the kingdom against three giant legendary bosses.</p>
        <ul>
          <li><strong>New Enemies:</strong> Wizard Rat (spawns magic energy projectiles), Robot Rat (tanky with electric sparks), Ninja Rat (fast dash and behind-the-back teleports), Giant Rat (heavy ground smashes), and Ghost Rat (semi-transparent phantom passing through block elements).</li>
          <li><strong>Arcade Power-ups:</strong> Collect Speed Fish (🐟 speed multiplier), Giant Paw (🐾 grows fighter scale and range), Shield (🛡️ protection), Double Jump (👟 secondary mid-air jumps), and Laser Yarn (🧶 fires homing laser beams on hit).</li>
          <li><strong>Rodent Boss Fights:</strong> Fight the legendary <strong>Rat King</strong> (throws crown spikes and summons minions), the metallic <strong>Robo Rat</strong> (charges and fires rocket missiles), and the elusive <strong>Cat Hunter</strong> (shoots tracking arrows).</li>
        </ul>
      `
    },
    'cats-among-us': {
      title: 'Cats Among Us',
      category: 'games',
      tag: 'Game',
      image: '🚀',
      firstAppearance: 'June 1, 2025',
      characters: 'Crewmates & Impostor Dogs',
      quotes: ['There is a dog among us!'],
      trivia: [
        "The saboteurs were originally going to be Rats, but it was changed to Impostor Dogs after community feedback.",
        "SS Meowstard has a hidden hamster cage room in the cargo bay."
      ],
      timeline: '<ul><li><strong>June 2025</strong> - Launch of SS Meowstard crew assignment.</li><li><strong>August 2025</strong> - Impostor Dogs update.</li></ul>',
      related: ['super-cat-world', 'catnip-kingdom'],
      content: `
        <p><strong>Cats Among Us</strong> is a multiplayer social deduction game set aboard the <em>SS Meowstard</em> spaceship. Feline crewmates must work together to maintain their ship's gravity cores and life support systems, while hidden impostor dogs attempt to sabotage the mission and eliminate the crew.</p>
        <h4>Roles & Deduction</h4>
        <p>Players are secretly assigned roles at the start of each match: Crewmates (Innocent, Engineer, Captain, Medic, Detective) must complete repair tasks. The Impostor Dogs must sneak through vents and disable systems. When a body is discovered, players debate and vote to eject suspected impostors into deep space.</p>
      `
    },
    'catnip-kingdom': {
      title: 'Catnip Kingdom',
      category: 'games',
      tag: 'Game',
      image: '🏰',
      firstAppearance: 'September 20, 2025',
      characters: 'King Cat, Royal Guards',
      quotes: ['Retrieve the relics, build the throne!'],
      trivia: [
        "Building blueprints are fully modular, allowing players to build castles matching actual historical structures.",
        "Ancient ruins contains lore scrolls referencing previous games in the series."
      ],
      timeline: '<ul><li><strong>Sept 2025</strong> - Alpha release of kingdom builder.</li><li><strong>Oct 2025</strong> - Volcanic caves update.</li></ul>',
      related: ['super-cat-world', 'lore-book-1'],
      content: `
        <p><strong>Catnip Kingdom</strong> is a grand adventure and city-building role-playing game (RPG). Set in the golden age of the feline civilization, players explore a vast open world to retrieve lost artifacts and construct their own thriving settlements.</p>
        <h4>Exploration & Crafting</h4>
        <p>Explore ruins, gather resources (lumber, stone, and glowing catnip crystals), and craft items, weapons, and structural pieces. Battle subterranean monsters and help local villagers to earn royal favors, building your kingdom block by block.</p>
      `
    },
    'catnip-kart': {
      title: 'Catnip Kart',
      category: 'games',
      tag: 'Game',
      image: '🏎️',
      firstAppearance: 'December 18, 2025',
      characters: 'Kart Racers',
      quotes: ['Drift to the finish!'],
      trivia: [
        "Drift boost multiplier was fine-tuned for months to feel fast yet responsive.",
        "Speedway timeline details training felines in fast racing for fun."
      ],
      timeline: '<ul><li><strong>Dec 2025</strong> - Racing beta.</li><li><strong>Jan 2026</strong> - Tracks expansion update.</li></ul>',
      related: ['super-smash-cats', 'world-of-catz'],
      content: `
        <p><strong>Catnip Kart</strong> is a high-speed, physics-based racing game featuring customizable kart vehicles, drift mechanics, and chaotic power-up items.</p>
        <h4>Racing Tracks & Items</h4>
        <p>Drift around sharp corners to build boost energy, and blast opponents using a variety of feline-themed items like heat-seeking hairballs, banana peels, and invincibility catnip. Race across tracks like the Catnip Forest Speedway, Floating Castle Clouds, and the lava-filled Subterranean Mines.</p>
      `
    },
    'characters': {
      title: 'Characters',
      category: 'characters',
      tag: 'Character',
      image: '👥',
      firstAppearance: 'Super Cat World (Level 1-1)',
      characters: 'Catnip, Clawz, Dreth, wisecat',
      quotes: ['Four heroes, one cosmic quest.'],
      trivia: [
        "P1 (Catnip) was originally modeled after the developer's real tabby cat.",
        "P4 (wisecat) is the only character who does not make jump sounds."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p>Super Cat World features four main characters in its roster, corresponding to Player 1 through Player 4:</p>
        <ul>
          <li><strong>P1:</strong> Catnip</li>
          <li><strong>P2:</strong> Clawz</li>
          <li><strong>P3:</strong> Dreth</li>
          <li><strong>P4:</strong> wisecat</li>
        </ul>
      `
    },
    'mechanics': {
      title: 'Mechanics',
      category: 'mechanics',
      tag: 'Mechanic',
      image: '⚙️',
      firstAppearance: 'Super Cat World prototype',
      quotes: ['Precision parkour is key.'],
      trivia: [
        "Wall-jump velocity multiplier is slightly increased in Hard mode to allow shortcuts.",
        "Double-jump particle effects are shaped like kitten paw prints."
      ],
      related: ['super-cat-world', 'items-power-ups'],
      content: `
        <p>The core gameplay systems of Super Cat World are designed around three main pillars:</p>
        <ul>
          <li><strong>Parcore (Parkour):</strong> Navigate complex horizontal and vertical levels using tight, responsive platforming maneuvers.</li>
          <li><strong>Boss Fights:</strong> Test your reflexes and master timing against distinct bosses guarding each sector.</li>
          <li><strong>Skill:</strong> Earn high ranks and clear stages faster by perfecting your movement combos.</li>
        </ul>
      `
    },
    'world-of-catz': {
      title: 'The World of Catz',
      category: 'locations',
      tag: 'Location',
      image: '🌍',
      firstAppearance: 'Super Cat World lore map',
      quotes: ['A universe of platforms and dangers.'],
      trivia: [
        "The World of Catz has nine distinct dimensional sectors.",
        "Gravity forces in the world are regulated by the Great Catnip Core."
      ],
      related: ['super-cat-world', 'studio-history'],
      content: `
        <p>All action in the game takes place in <strong>the world of catz</strong>, a custom-designed universe full of parkour structures, hazards, and enemy territories.</p>
      `
    },
    'items-power-ups': {
      title: 'Items & Power-ups',
      category: 'items',
      tag: 'Item',
      image: '🍄',
      firstAppearance: 'Super Cat World (Level 1-2)',
      quotes: ['Collect them all to power up!'],
      trivia: [
        "Fire Protector was originally a secret item hidden in level 12.",
        "Mini Mushroom allows players to find tiny easter-egg passages."
      ],
      related: ['super-cat-world', 'mechanics'],
      content: `
        <p>Enhance your abilities and survive battles by collecting items and power-ups throughout the levels:</p>
        <ul>
          <li><strong>Fire Flower:</strong> Grants fireball-shooting capabilities to clear obstacles and defeat enemies.</li>
          <li><strong>Extra Life:</strong> Adds an extra life to your attempts pool.</li>
          <li><strong>Speed Boost:</strong> Grants temporary movement speed acceleration.</li>
          <li><strong>Shield:</strong> Blocks one incoming hit or trap damage.</li>
          <li><strong>Big Mushroom:</strong> Enlarges the character to smash obstacles.</li>
          <li><strong>Mini Mushroom:</strong> Shrinks the character to fit into tiny passages.</li>
          <li><strong>Fire Protector:</strong> Safeguards the character against fire traps and hot lava hazards.</li>
          <li><strong>Cat Revive:</strong> Allows players to revive fallen comrades (Multiplayer only).</li>
        </ul>
      `
    },
    'studio-history': {
      title: 'Studio Development History',
      category: 'history',
      tag: 'History',
      image: '🏢',
      firstAppearance: 'Catnip Studios founder board',
      quotes: ['Coding feline dreams since 2025.'],
      trivia: [
        "The first line of code was written in a local coffee shop during a blizzard.",
        "Logo design was selected through an online cat community poll."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p>Catnip Studios' development history officially begins on the <strong>24th of February, 2025</strong>.</p>
        <h4>Origins</h4>
        <p>The studio was established to create its debut title, the action-platformer <strong>Super Cat World</strong>. You can play it directly using the link in the Games section.</p>
      `
    },
    'lore-book-1': {
      title: 'Book I: The First Meow',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 1 (Level 0)',
      characters: 'Great Catnip Tree, Feline Clans, Rat King',
      quotes: ['Long ago, before time had a name...'],
      trivia: [
        "Book 1 was hidden behind a breakable block in the tutorial world.",
        "Refers to the ancient origins of the Nine Feline Realms."
      ],
      related: ['super-cat-world', 'catnip-kingdom'],
      content: `
        <p class="text-italic">"Long ago, before time had a name, the Great Catnip Tree sprouted in the center of the cosmos. Its roots tapped into ancient wells of magic, and its leaves breathed life into the world, bringing forth the Nine Feline Realms. The Cat Clan built their grand cities in its shade, living in eternal peace and harmony. They guarded the Golden Catnip, a sacred relic keeping their magic alive. But darkness brewed in the lowlands. The Rat King, Miner rat and the pirate rat, jealous of their prosperity, coveted the Golden Catnip's power to fuel his dark legion."</p>
        <h4>Lore & Meaning</h4>
        <p>This inaugural volume reveals the mythic creation story of the Cat Clan and the Nine Feline Realms by the Great Catnip Tree. It details the peaceful era of feline civilization before conflict erupted when the Rat King, Miner rat, and pirate rat launched an assault to claim the sacred Golden Catnip to power their armies.</p>
        <p><strong>Unlock Location:</strong> World 1 (Level 0)</p>
      `
    },
    'lore-book-2': {
      title: 'Book II: Whispers in the Wall',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 4 (Level 3)',
      characters: 'Rat King, Captured Kittens',
      quotes: ['Whispers echoed in the walls of the castle...'],
      trivia: [
        "Documents the heavy militarization of the castle area.",
        "Spike traps design was inspired by ancient Egyptian tombs."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p class="text-italic">"Following his sudden invasion, the Rat King seized the sacred grounds and constructed his iron fortress directly atop the ancient cat ruins. He forced his subjects to mine the deep mountains, forging iron-tipped spears and heavy armor for his soldiers. He trained legions of archers, positioning them along the high stone ramparts to repel feline scout parties. Whispers echoed in the walls of the castle of hidden passages and dark dungeons where captured kittens were locked away, waiting for a savior."</p>
        <h4>Lore & Meaning</h4>
        <p>Documents the Rat King's militarization after seizing territory. He erected a heavy iron stronghold over sacred feline ruins, forcing his subjects to mine the deep mountains to forge gear for spear-throwers and archers to defend his perimeter against cat scouts.</p>
        <p><strong>Unlock Location:</strong> World 4 (Level 3)</p>
      `
    },
    'lore-book-3': {
      title: 'Book III: Secrets of the Throne',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 5 (Level 4)',
      characters: 'Rat King',
      quotes: ['Only well-timed stomps from above can shatter his defense.'],
      trivia: [
        "Explains the exact mechanics required to beat the first boss.",
        "The heavy crown decreases the Rat King's movement speed by 15%."
      ],
      related: ['super-cat-world', 'mechanics'],
      content: `
        <p class="text-italic">"A dusty scroll found in the castle vaults details the secrets of the throne room. When cornered, the Rat King relies on illusion magic, summoning shadow clones to confuse his attackers while hiding behind iron shields. He triggers floor spike traps to catch foes off balance. However, the scroll notes a critical weakness: his crown is heavy, making his head vulnerable. Legend says only well-timed stomps from above can shatter his defense and break his magical barrier."</p>
        <h4>Lore & Meaning</h4>
        <p>A tactical codex detailing the Rat King's boss combat patterns. It explains his reliance on shadow clones and concealed floor spikes when cornered, advising heroes that precise jumping stomps are necessary to crack his crown armor.</p>
        <p><strong>Unlock Location:</strong> World 5 (Level 4)</p>
      `
    },
    'lore-book-4': {
      title: 'Book IV: Ships in the Sky',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 7 (Level 6)',
      characters: 'Pirate Captain Rattail',
      quotes: ['No land-dwelling cat could ever reach his airborne treasury.'],
      trivia: [
        "Sky coins are heavier than standard gold coins due to wind resistance elements.",
        "Sky ships are propelled by enchanted balloons and sails."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p class="text-italic">"When the Rat King's ground fortress fell, his chief naval commander, Pirate Captain Rattail, refused to surrender. Gathering the remaining royal treasures, he fled to the sky islands. There, using floating lumber and sky sails, he constructed an armada of massive wooden warships. He began raiding the trade routes, hoarding thousands of golden sky coins on his vessels. Safe in the clouds, he believed no land-dwelling cat could ever reach his airborne treasury or breach his fleet."</p>
        <h4>Lore & Meaning</h4>
        <p>Introduces the second major antagonist, Pirate Captain Rattail. Following the fall of the land fortress, Rattail constructed an armada of floating sky ships to hoard the kingdom's sky coins out of reach of land-dwelling cats.</p>
        <p><strong>Unlock Location:</strong> World 7 (Level 6)</p>
      `
    },
    'lore-book-5': {
      title: "Book V: The Sky Captain's Vow",
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 11 (Level 10)',
      characters: 'Pirate Captain Rattail, Legendary Sky Fish',
      quotes: ['Never drop anchor until he caught the Legendary Sky Fish.'],
      trivia: [
        "Sky Fish grants three wishes, but only if caught using a golden string.",
        "The Sea-Rat flagship has double-deck heavy cannons firing explosive iron balls."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p class="text-italic">"Obsessed with the legends of the clouds, Captain Rattail made a solemn vow to never drop anchor until he caught the Legendary Sky Fish, a mythical creature said to grant infinite wishes. His massive flagship, the Sea-Rat, was custom-built for this hunt, armed with double-deck heavy cannons firing explosive iron balls. To repel agile invaders, he rigged spinning yarn launch pads and flying harpoons across the decks, turning his flagship into a floating fortress of death."</p>
        <h4>Lore & Meaning</h4>
        <p>Exposes Captain Rattail's obsession with capturing the Legendary Sky Fish. It warns players of his sky flagship's weapons: heavy naval cannonballs and spinning yarn traps designed to entangle airborne cats.</p>
        <p><strong>Unlock Location:</strong> World 11 (Level 10)</p>
      `
    },
    'lore-book-6': {
      title: 'Book VI: Crystal Depths',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 13 (Level 12)',
      characters: 'Feline Cavern Miners',
      quotes: ['Caverns are completely impassable without magical protection.'],
      trivia: [
        "Luminous crystals emit heat when exposed to cosmic starlight.",
        "Magma flows at a speed of 1.2 blocks per second in the lava pits."
      ],
      related: ['super-cat-world', 'items-power-ups'],
      content: `
        <p class="text-italic">"Beneath the roots of the world lies a network of ancient caves, glowing with giant luminous crystals and flowing rivers of boiling magma. Feline miners once gathered rare gems here, but the heat grew too intense as volcanic fissures opened. The texts warn that the deep caverns are completely impassable without magical protection. Only a hero wearing the Fire Protector aura can walk through the ash storms, withstand the magma hazards, and survive the scorching subterranean beasts."</p>
        <h4>Lore & Meaning</h4>
        <p>Explores the volcanic subterranean biome beneath the World of Catz. It warns of rivers of magma and highlights the necessity of equipping the <strong>Fire Protector</strong> power-up to traverse hot magma zones unharmed.</p>
        <p><strong>Unlock Location:</strong> World 13 (Level 12)</p>
      `
    },
    'lore-book-7': {
      title: "Book VII: The Miner's Greed",
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 22 (Level 21)',
      characters: 'Miner Boss Rattock',
      quotes: ['His greed consumed him, transforming him into a paranoid warden.'],
      trivia: [
        "Unstable TNT minecarts explode on contact with fire traps.",
        "Earthquakes trigger every 30 seconds inside the boss arena."
      ],
      related: ['super-cat-world', 'world-of-catz'],
      content: `
        <p class="text-italic">"Blinded by a thirst for riches, Miner Boss Rattock commanded his workers to dig deeper into the mountain than anyone had ever dared. They breached the ancient volcanic core, triggers earthquakes and mine collapses. Rather than retreating, Rattock weaponized the chaos. He designed high-speed minecarts filled with unstable TNT explosives and rigged the cavern arches to drop crushing boulders on intruders. His greed consumed him, transforming him into a paranoid warden of the dark mines."</p>
        <h4>Lore & Meaning</h4>
        <p>Details the background of the third boss, Miner Boss Rattock. Obsessed with subterranean crystal mining, Rattock destabilized the caverns, weaponizing rolling minecart explosives and falling ceiling debris.</p>
        <p><strong>Unlock Location:</strong> World 22 (Level 21)</p>
      `
    },
    'lore-book-8': {
      title: 'Book VIII: The Glitched Realm',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 26 (Level 25)',
      characters: 'The Elder Cats',
      quotes: ['Platforms flicker in and out of existence, gravity flips...'],
      trivia: [
        "Secret silver pipes act as portals bypassing standard platform levels.",
        "Gravity anomalies can flip P1 vertically while leaving enemies unaffected."
      ],
      related: ['super-cat-world', 'mechanics'],
      content: `
        <p class="text-italic">"At the edge of reality, hidden behind the secret silver pipes, lies a fractured dimension known as the Glitched Lands. In this bizarre realm, the laws of physics break down entirely. Platforms flicker in and out of existence, gravity flips upside down at a moment's notice, and reality itself appears corrupted by digital anomalies. The elder cats warned that this frontier is a one-way trip, as the unstable fabric of the realm tears apart any traveler who lacks absolute focus."</p>
        <h4>Lore & Meaning</h4>
        <p>The mystery codex describing the endgame dimension known as <strong>The Glitched Lands</strong>. Located beyond secret silver pipes, this corrupted zone alters gravity and reality, standing as the ultimate test of platforming mastery.</p>
        <p><strong>Unlock Location:</strong> World 26 (Level 25 - Glitched Lands)</p>
      `
    },
    'lore-book-9': {
      title: 'Book IX: The Glitched Core',
      category: 'lore',
      tag: 'Lore Book',
      image: '📖',
      firstAppearance: 'World 30 (Level 29)',
      characters: 'The Sentient Core, Ancient Prophets',
      quotes: ['Only a hero brave enough to navigate shifting gravity fields...'],
      trivia: [
        "The Glitched Core can clone previous bosses (Rat King, Rattail, Rattock) as hollow code shadows.",
        "Beating the Core unlocks the final developer credit reel easter egg."
      ],
      related: ['super-cat-world', 'lore-book-8'],
      content: `
        <p class="text-italic">"Deep inside the glitched dimension floats the source of all instability: the Glitched Core. It is a sentient, pulsing heart made of corrupted source code and chaotic energy. The Core seeks to rewrite the entire universe in its own image, threatening to dissolve the Nine Feline Realms into static. The ancient prophets wrote that only a hero brave enough to navigate the shifting gravity fields and destroy the Core's firewall can permanently stabilize the code, saving reality."</p>
        <h4>Lore & Meaning</h4>
        <p>The final codex entry of the game describing the central anomaly of the Glitched Realm: <strong>The Glitched Core</strong>. Defeating this digital heart stabilizes reality and rescues the world from corruption.</p>
        <p><strong>Unlock Location:</strong> World 30 (Level 29 - final Core boss arena)</p>
      `
    }
  };

  // ==================== DOM ELEMENTS ====================
  const navLinks = document.querySelectorAll('.nav-link');
  const appSections = document.querySelectorAll('.app-section');
  const logoLink = document.getElementById('logo-link');
  const navMenu = document.getElementById('nav-menu');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');

  // Secrets UI
  const secretsNavTrigger = document.getElementById('secrets-nav-trigger');
  const secretsOpenBtn = document.getElementById('secrets-open-btn');
  const securityModal = document.getElementById('security-modal');
  const securityForm = document.getElementById('security-form');
  const codeInput = document.getElementById('access-code-input');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const attemptsFeedback = document.getElementById('attempts-feedback');
  const securityCancelBtn = document.getElementById('security-cancel-btn');
  const securitySubmitBtn = document.getElementById('security-submit-btn');
  const lockIcon = document.getElementById('lock-icon');
  const scwSecretsBtn = document.querySelector('.featured-game .btn-secondary');

  // Wiki UI
  const searchInput = document.getElementById('wiki-search-input');
  const clearSearchBtn = document.getElementById('wiki-search-clear');
  const categoryFilters = document.getElementById('wiki-category-filters');
  const wikiArticlesGrid = document.getElementById('wiki-articles-grid');
  const wikiNoResults = document.getElementById('wiki-no-results');
  const wikiReaderModal = document.getElementById('wiki-reader-modal');
  const wikiReaderClose = document.getElementById('wiki-reader-close');
  const wikiReaderBody = document.getElementById('wiki-reader-body');

  // Timers for autolocking when leaving the dev tab/section
  let devTabLeaveTimer = null;
  let devVisibilityLeaveTimer = null;

  function lockDevPortal() {
    sessionStorage.removeItem('dev_auth');
    secretsNavTrigger.classList.remove('unlocked');
    secretsNavTrigger.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Dev Portal
    `;
    if (currentSection === 'secrets') {
      window.location.hash = 'home';
    }
    clearTimeout(devTabLeaveTimer);
    devTabLeaveTimer = null;
    clearTimeout(devVisibilityLeaveTimer);
    devVisibilityLeaveTimer = null;
  }

  function unlockDevPortalUI() {
    if (secretsNavTrigger) {
      secretsNavTrigger.classList.add('unlocked');
      secretsNavTrigger.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          <circle cx="12" cy="16" r="1.5"></circle>
        </svg>
        Dev Panel
      `;
    }
  }

  // ==================== STRESS JOURNAL RENDERERS ====================
  function displayJournalEntries(entries) {
    const containers = [
      document.getElementById('public-journal-entries-list'),
      document.getElementById('journal-entries-list')
    ];

    containers.forEach(container => {
      if (!container) return;
      const dynamicItems = container.querySelectorAll('.journal-entry-dynamic');
      dynamicItems.forEach(el => el.remove());

      entries.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'journal-entry-item journal-entry-dynamic';
        item.style.cssText = 'background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 18px;';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: var(--color-accent); font-family: var(--font-headings);">Reflection Note #${idx + 2}</strong>
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">${escapeHtml(entry.date)}</span>
          </div>
          <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text-secondary);" class="font-readable">${escapeHtml(entry.text)}</p>
        `;
        container.appendChild(item);
      });
    });
  }

  function renderStressJournal() {
    let savedEntries = [];
    try {
      savedEntries = JSON.parse(localStorage.getItem('scw_stress_journal') || '[]');
    } catch (e) {
      savedEntries = [];
    }

    displayJournalEntries(savedEntries);

    // Sync from Cloud Firestore if available
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        db.collection('stress_reflections').orderBy('timestamp', 'asc').onSnapshot((snapshot) => {
          const cloudEntries = [];
          snapshot.forEach((doc) => cloudEntries.push(doc.data()));
          if (cloudEntries.length > 0) {
            displayJournalEntries(cloudEntries);
          }
        }, (err) => {
          console.warn("Firestore reflections sync info:", err);
        });
      } catch (e) {
        console.warn("Firestore reflections init info:", e);
      }
    }
  }

  // Cryptographic Helper Functions for Developer Profiling (Hack Proof Verification)
  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let result = '';
    const words = [];
    const asciiLength = ascii[lengthProperty] * 8;
    let hash = sha256.h = sha256.h || [];
    let k = sha256.k = sha256.k || [];
    let primeCounter = k[lengthProperty];
    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) {
          isComposite[i] = 1;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (let i = 0; i < ascii[lengthProperty]; i++) {
      const charCode = ascii.charCodeAt(i);
      if (charCode >> 8) return;
      words[i >> 2] |= charCode << (24 - (i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiLength | 0);
    for (let j = 0; j < words[lengthProperty]; ) {
      const w = words.slice(j, j += 16);
      const oldHash = hash.slice(0);
      hash = [0, 1, 2, 3, 4, 5, 6, 7].map((index) => hash[index]);
      for (let i = 0; i < 64; i++) {
        const w16 = w[i - 16], w15 = w[i - 15], w7 = w[i - 7], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (w[i] = (i < 16 ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0));
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (let i = 0; i < 8; i++) {
      for (let j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16 ? '0' : '') + b.toString(16));
      }
    }
    return result;
  }

  function isDeveloperEmail(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const devHash = '475439de95c9296c038b5fea203be30c0e4ff4ea619771a4e525136bc8a11360';
    return sha256(cleanEmail) === devHash || 
           cleanEmail.includes('kyan') || 
           cleanEmail.includes('catnip') || 
           cleanEmail.includes('admin');
  }

  function triggerLockdown() {
    localStorage.setItem('scw_lockdown_active', 'true');
    showLockdownScreen();
  }

  function showLockdownScreen() {
    if (document.getElementById('lockdown-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lockdown-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(5, 2, 10, 0.98); backdrop-filter: blur(25px); z-index: 9999999; display: flex; align-items: center; justify-content: center; color: #FFF; font-family: "Space Grotesk", sans-serif; padding: 20px; text-align: center;';
    overlay.innerHTML = `
      <div style="max-width: 500px; padding: 30px; background: rgba(255, 61, 0, 0.05); border: 2px dashed #FF3D00; border-radius: 12px; box-shadow: 0 0 30px rgba(255, 61, 0, 0.2);">
        <span style="font-size: 3.5rem; display: block; margin-bottom: 15px; filter: drop-shadow(0 0 10px #FF3D00);">⚠️</span>
        <h2 style="color: #FF3D00; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Security Lockdown</h2>
        <p style="font-size: 0.95rem; color: #FFF; line-height: 1.6; margin-bottom: 20px;">
          This session has been flagged and locked down for unauthorized developer access spoofing.
        </p>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.5; margin-bottom: 25px;">
          To reactivate this account, please contact the administrator on our official Discord server.
        </p>
        <a href="https://discord.gg/DbKu8WDw7M" target="_blank" class="btn btn-primary" style="background: #FF3D00; border-color: #FF3D00; box-shadow: 0 0 15px rgba(255, 61, 0, 0.4); text-transform: uppercase; font-weight: 700; padding: 8px 20px; font-size: 0.82rem;">Discord Server</a>
      </div>
    `;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
  }

  // ==================== SPA NAVIGATION SYSTEM ====================
  
  // Navigate to target section
  function navigateTo(sectionId) {
    // Check if section is secrets and if authorized
    if (sectionId === 'secrets') {
      const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
      const isDevSession = isDeveloperEmail(localEmail);
      const isAuth = sessionStorage.getItem('dev_auth') === 'true' || isDevSession;
      
      if (!isAuth) {
        // Stop navigation, open gate modal
        openSecurityGate();
        // Restore hash to previous or home
        window.location.hash = currentSection === 'secrets' ? 'home' : currentSection;
        return;
      }
      // Clear timers if user returned to dev secrets section
      if (devTabLeaveTimer) {
        clearTimeout(devTabLeaveTimer);
        devTabLeaveTimer = null;
      }
      if (devVisibilityLeaveTimer) {
        clearTimeout(devVisibilityLeaveTimer);
        devVisibilityLeaveTimer = null;
      }
    } else {
      // If we are leaving the secrets section, start the 1-minute autolock timer
      if (currentSection === 'secrets') {
        if (!devTabLeaveTimer) {
          devTabLeaveTimer = setTimeout(lockDevPortal, 60 * 1000);
        }
      }
    }

    currentSection = sectionId;
    
    // Close mobile nav menu if open
    navMenu.classList.remove('mobile-open');
    mobileNavToggle.classList.remove('open');

    // Scroll window to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update Nav links active states
    const currentNavLinks = document.querySelectorAll('.nav-link');
    currentNavLinks.forEach(link => {
      if (link.getAttribute('data-target') === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Sections display states
    const currentAppSections = document.querySelectorAll('.app-section');
    currentAppSections.forEach(section => {
      const idMatches = section.getAttribute('id') === `${sectionId}-section`;
      if (idMatches) {
        section.classList.add('active');
        section.style.setProperty('display', 'block', 'important');
      } else {
        section.classList.remove('active');
        section.style.setProperty('display', 'none', 'important');
      }
    });

    // Reload leaderboard dynamically when opening Community section
    if (sectionId === 'community') {
      loadLeaderboard();
    }
    if (sectionId === 'stress') {
      if (typeof renderStressJournal === 'function') renderStressJournal();
    }
    if (sectionId === 'secrets') {
      if (typeof loadUserDirectory === 'function') loadUserDirectory();
      if (typeof updateBankUI === 'function') updateBankUI();
    }
  }

  // Explicit click listeners for nav links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = link.getAttribute('data-target');
      if (target) {
        e.preventDefault();
        window.location.hash = target;
        navigateTo(target);
        if (typeof playRetroSound === 'function') {
          playRetroSound('click');
        }
      }
    });
  });

  // Monitor hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'home';
    const validSections = ['home', 'games', 'wiki', 'map', 'news', 'stress', 'shop', 'community', 'secrets'];
    if (validSections.includes(hash)) {
      navigateTo(hash);
    }
  });

  // Catch dynamic internal nav trigger clicks
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.nav-trigger');
    if (trigger) {
      const target = trigger.getAttribute('data-target');
      if (target) {
        e.preventDefault();
        window.location.hash = target;
        navigateTo(target);
        if (typeof playRetroSound === 'function') {
          playRetroSound('click');
        }
      }
    }
  });

  // Check initial load hash
  const initialHash = window.location.hash.substring(1) || 'home';
  navigateTo(initialHash);

  // Mobile navigation hamburger toggle
  mobileNavToggle.addEventListener('click', () => {
    mobileNavToggle.classList.toggle('open');
    navMenu.classList.toggle('mobile-open');
  });

  // Close nav menu when clicking backdrop of page
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('mobile-open') && 
        !navMenu.contains(e.target) && 
        !mobileNavToggle.contains(e.target)) {
      navMenu.classList.remove('mobile-open');
      mobileNavToggle.classList.remove('open');
    }
  });

  // ==================== SECURITY GATE access control ====================
  // SHA-256 hash of the access code (encrypted / non-plaintext)
  const ACCESS_CODE_HASH = '307a60d2be1be12717f4593b4ab3f2543eafe69a2cae6b8dbe20309dea444249';
  const LOCKOUT_MS = 3 * 60 * 1000; // 3 minutes lockout
  const MAX_ATTEMPTS = 3;

  // Helper function to hash text using Web Crypto SHA-256
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Initialize Attempts and Lockouts in LocalStorage
  if (localStorage.getItem('dev_attempts') === null) {
    localStorage.setItem('dev_attempts', MAX_ATTEMPTS.toString());
  }

  // Check state on page load
  checkLockoutState();

  // Open security gate modal
  function openSecurityGate() {
    // Check if the current logged-in user is the developer (catnip)
    const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
    const isDevSession = isDeveloperEmail(localEmail);

    // If already authenticated or logged in as Dev, jump straight to panel
    if (sessionStorage.getItem('dev_auth') === 'true' || isDevSession) {
      sessionStorage.setItem('dev_auth', 'true');
      window.location.hash = 'secrets';
      return;
    }

    securityModal.style.display = 'flex';
    codeInput.value = '';
    codeInput.type = 'password';
    togglePasswordBtn.querySelector('svg').style.opacity = '1';
    
    checkLockoutState(); // Double check time limits
    
    // Focus input if not locked
    const isLocked = isCurrentlyLocked();
    if (!isLocked) {
      setTimeout(() => codeInput.focus(), 150);
    }
  }

  // Close security modal
  function closeSecurityGate() {
    securityModal.style.display = 'none';
    codeInput.value = '';
    // Clear shake animations classes
    const card = securityModal.querySelector('.security-card-modal');
    card.classList.remove('shake-animation');
  }

  // Check if locked right now
  function isCurrentlyLocked() {
    const lockUntil = parseInt(localStorage.getItem('dev_lock_until') || '0', 10);
    return lockUntil > Date.now();
  }

  // Update lockout UI states
  function checkLockoutState() {
    const lockUntil = parseInt(localStorage.getItem('dev_lock_until') || '0', 10);
    const now = Date.now();

    if (lockUntil > now) {
      // Locked state active
      codeInput.disabled = true;
      securitySubmitBtn.disabled = true;
      securityModal.querySelector('.security-card-modal').classList.add('lock-active');
      lockIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF5252" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          <line x1="8" y1="16" x2="16" y2="16"></line>
        </svg>
      `;

      // Start tick countdown
      if (!lockTimerInterval) {
        lockTimerInterval = setInterval(updateLockoutCountdown, 1000);
        updateLockoutCountdown();
      }
    } else {
      // Unlocked / Normal state
      clearInterval(lockTimerInterval);
      lockTimerInterval = null;
      localStorage.removeItem('dev_lock_until');
      
      // If attempts was 0, reset it
      if (parseInt(localStorage.getItem('dev_attempts') || '0', 10) <= 0) {
        localStorage.setItem('dev_attempts', MAX_ATTEMPTS.toString());
      }

      codeInput.disabled = false;
      securitySubmitBtn.disabled = false;
      securityModal.querySelector('.security-card-modal').classList.remove('lock-active');
      lockIcon.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C4DFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      `;

      const attemptsLeft = localStorage.getItem('dev_attempts');
      attemptsFeedback.innerHTML = `<span>${attemptsLeft} attempts left</span>`;
    }
  }

  // Lock timer countdown ticking
  function updateLockoutCountdown() {
    const lockUntil = parseInt(localStorage.getItem('dev_lock_until') || '0', 10);
    const now = Date.now();
    const diff = lockUntil - now;

    if (diff <= 0) {
      // Timer finished
      checkLockoutState();
    } else {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const secondsFormatted = seconds < 10 ? '0' + seconds : seconds;
      
      attemptsFeedback.innerHTML = `
        <span class="lock-text">
          Access denied. Invalid code.<br>
          locked for ${minutes}:${secondsFormatted}
        </span>
      `;
    }
  }

  // Handle password submit verification
  securityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isCurrentlyLocked()) return;

    const inputVal = codeInput.value.trim();
    if (!inputVal) return;

    const card = securityModal.querySelector('.security-card-modal');
    card.classList.remove('shake-animation');

    const inputHash = await sha256(inputVal);

    if (inputHash === ACCESS_CODE_HASH) {
      // SUCCESS!
      localStorage.setItem('dev_attempts', MAX_ATTEMPTS.toString());
      localStorage.removeItem('dev_lock_until');
      sessionStorage.setItem('dev_auth', 'true');

      // Success visual feedback
      card.classList.add('success-flash');
      attemptsFeedback.innerHTML = `<span class="green-text">Access Granted. Opening portal...</span>`;
      
      // Update UI button and status
      secretsNavTrigger.classList.add('unlocked');
      secretsNavTrigger.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          <circle cx="12" cy="16" r="1.5"></circle>
        </svg>
        Dev Panel
      `;

      setTimeout(() => {
        closeSecurityGate();
        card.classList.remove('success-flash');
        window.location.hash = 'secrets';
      }, 700);

    } else {
      // INCORRECT CODE
      let attempts = parseInt(localStorage.getItem('dev_attempts') || '3', 10);
      attempts--;
      localStorage.setItem('dev_attempts', attempts.toString());

      // Play shake animation
      card.classList.add('shake-animation');
      setTimeout(() => card.classList.remove('shake-animation'), 410);

      if (attempts <= 0) {
        // LOCK THE USER
        const lockExpiration = Date.now() + LOCKOUT_MS;
        localStorage.setItem('dev_lock_until', lockExpiration.toString());
        checkLockoutState();
      } else {
        // Show remaining attempts error message (User requirement matching)
        attemptsFeedback.innerHTML = `
          <span class="error-text">
            Access denied. Invalid code.<br>
            ${attempts} attempts left<br>
            if you run out of attempts it locks for 3 mins
          </span>
        `;
      }
    }
  });

  // Toggle access code visibility
  togglePasswordBtn.addEventListener('click', () => {
    if (codeInput.type === 'password') {
      codeInput.type = 'text';
      togglePasswordBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      codeInput.type = 'password';
      togglePasswordBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  });

  // Open triggers
  secretsNavTrigger.addEventListener('click', openSecurityGate);
  secretsOpenBtn.addEventListener('click', openSecurityGate);
  scwSecretsBtn.addEventListener('click', openSecurityGate);

  // Close triggers
  securityCancelBtn.addEventListener('click', closeSecurityGate);
  securityModal.addEventListener('click', (e) => {
    if (e.target === securityModal) {
      closeSecurityGate();
    }
  });

  // ==================== WIKI ENGINE ====================

  // Filter and Search Wiki Cards in the DOM
  function filterWiki() {
    const cards = wikiArticlesGrid.querySelectorAll('.wiki-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.getAttribute('data-category');
      const keywords = card.getAttribute('data-keywords').toLowerCase();
      const title = card.querySelector('.wiki-title').textContent.toLowerCase();
      const excerpt = card.querySelector('.wiki-excerpt').textContent.toLowerCase();

      // Check category match
      const categoryMatch = activeWikiCategory === 'all' || category === activeWikiCategory;

      // Check search match
      const searchMatch = !wikiSearchQuery || 
        title.includes(wikiSearchQuery) || 
        excerpt.includes(wikiSearchQuery) || 
        keywords.includes(wikiSearchQuery);

      if (categoryMatch && searchMatch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show/hide no results state
    if (visibleCount === 0) {
      wikiArticlesGrid.style.display = 'none';
      wikiNoResults.style.display = 'flex';
    } else {
      wikiArticlesGrid.style.display = 'grid';
      wikiNoResults.style.display = 'none';
    }
  }

  // Category filter click handler
  categoryFilters.addEventListener('click', (e) => {
    const button = e.target.closest('.cat-btn');
    if (!button) return;

    // Toggle active styles on pills
    categoryFilters.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    activeWikiCategory = button.getAttribute('data-category');
    filterWiki();
  });

  // Search input typing handler
  searchInput.addEventListener('input', () => {
    wikiSearchQuery = searchInput.value.toLowerCase().trim();

    if (wikiSearchQuery.length >= 3) {
      incrementQuestProgress('wiki_search');
    }

    // Toggle clear search button visibility
    if (wikiSearchQuery.length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }

    filterWiki();
  });

  // Clear search button handler
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    wikiSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    filterWiki();
  });

  // Click on "Read Entry" or Wiki Card to open full article in modal
  document.addEventListener('click', (e) => {
    const targetEl = e.target.closest('.btn-read-wiki') || e.target.closest('.wiki-card');
    if (!targetEl) return;

    let articleKey = targetEl.getAttribute('data-article');
    if (!articleKey) {
      const readBtn = targetEl.querySelector('.btn-read-wiki');
      if (readBtn) articleKey = readBtn.getAttribute('data-article');
    }

    if (!articleKey) return;
    const article = wikiArticles[articleKey];

    if (article) {
      wikiPagesRead++;
      if (typeof addXP === 'function') addXP(10);
      
      // Increment Wiki Daily Quests
      incrementQuestProgress('wiki_read');
      if (article.category === 'lore') incrementQuestProgress('wiki_lore');
      if (article.category === 'characters') incrementQuestProgress('wiki_character');
      if (article.category === 'locations') incrementQuestProgress('wiki_location');
      if (article.category === 'items') incrementQuestProgress('wiki_item');
      
      // Let's also check if they read a "new wiki article" (rare quest)
      // Since all articles in the DB are technically valid:
      incrementQuestProgress('wiki_read_all');

      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      checkAchievements();

      // Injects details inside the modal body
      let infoboxHtml = '';
      if (article.image || article.firstAppearance || article.characters) {
        infoboxHtml = `
          <div class="wiki-infobox" style="background: rgba(124, 77, 255, 0.06); border: 2px solid var(--color-primary); border-radius: 8px; padding: 15px; width: 100%; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); box-sizing: border-box;">
            ${article.image ? `<div style="text-align: center; font-size: 3.5rem; background: rgba(0,0,0,0.2); padding: 10px; border-radius: var(--radius-sm); border: 1px dashed var(--border-light);">${article.image}</div>` : ''}
            <div style="font-family: var(--font-headings); font-weight: 700; font-size: 0.9rem; text-align: center; border-bottom: 1px solid var(--border-light); padding-bottom: 5px; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.5px;">Quick Facts</div>
            ${article.firstAppearance ? `<div style="font-size: 0.8rem; display: flex; justify-content: space-between;"><strong style="color: var(--color-text-secondary); margin-right: 10px;">First Appearance:</strong> <span style="color: #FFF; font-weight: 600; text-align: right;">${article.firstAppearance}</span></div>` : ''}
            ${article.characters ? `<div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 2px;"><strong style="color: var(--color-text-secondary);">Characters Involved:</strong> <span style="color: #FFF; font-weight: 600; font-size: 0.78rem;">${article.characters}</span></div>` : ''}
          </div>
        `;
      }

      let quotesHtml = '';
      if (article.quotes && article.quotes.length > 0) {
        quotesHtml = `
          <div class="wiki-quotes-container" style="margin-top: 15px; padding: 12px 18px; border-left: 4.5px solid var(--color-accent); background: rgba(213,0,249,0.08); border-radius: 0 8px 8px 0; font-style: italic; color: #FFF; font-family: var(--font-headings); font-size: 0.9rem;">
            ${article.quotes.map(q => `<p style="margin: 4px 0;">"${q}"</p>`).join('')}
          </div>
        `;
      }

      let timelineHtml = '';
      if (article.timeline) {
        timelineHtml = `
          <div class="wiki-timeline-container" style="margin-top: 20px;">
            <h4 style="font-family: var(--font-headings); font-weight: 700; font-size: 1.1rem; color: var(--color-primary); border-bottom: 1px dashed var(--border-light); padding-bottom: 5px; margin-bottom: 10px; margin-top: 0;">📜 Historical Timeline</h4>
            <div style="font-size: 0.82rem; color: var(--color-text-secondary); line-height: 1.4;">${article.timeline}</div>
          </div>
        `;
      }

      let triviaHtml = '';
      if (article.trivia && article.trivia.length > 0) {
        triviaHtml = `
          <div class="wiki-trivia-container" style="margin-top: 20px;">
            <h4 style="font-family: var(--font-headings); font-weight: 700; font-size: 1.1rem; color: var(--color-primary); border-bottom: 1px dashed var(--border-light); padding-bottom: 5px; margin-bottom: 10px; margin-top: 0;">💡 Trivia & Lore Facts</h4>
            <ul style="font-size: 0.82rem; color: var(--color-text-secondary); padding-left: 20px; line-height: 1.5; margin: 5px 0;">
              ${article.trivia.map(t => `<li style="margin-bottom: 6px;">${t}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      let relatedHtml = '';
      if (article.related && article.related.length > 0) {
        relatedHtml = `
          <div class="wiki-related-container" style="margin-top: 25px; border-top: 1px solid var(--border-light); padding-top: 15px;">
            <span style="font-size: 0.72rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 8px; letter-spacing: 0.5px;">Related Articles</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${article.related.map(relKey => {
                const relArt = wikiArticles[relKey];
                if (!relArt) return '';
                return `<button class="btn btn-secondary btn-sm btn-read-wiki" data-article="${relKey}" style="margin: 0; font-size: 0.72rem; padding: 4px 10px; font-weight: 700;">${relArt.title}</button>`;
              }).join('')}
            </div>
          </div>
        `;
      }

      wikiReaderBody.innerHTML = `
        <div class="wiki-article-body" style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
          <div class="wiki-article-header" style="border-bottom: 1px solid var(--border-light); padding-bottom: 10px; margin-bottom: 5px;">
            <span class="wiki-tag">${article.tag}</span>
            <h2 style="font-family: var(--font-headings); font-size: 1.8rem; margin: 4px 0 0; color: #FFF;">${article.title}</h2>
          </div>
          
          <div class="wiki-layout-container">
            <!-- Left/Main Column -->
            <div class="wiki-main-column">
              <div class="wiki-article-text font-readable" style="line-height: 1.6; font-size: 0.92rem; color: var(--color-text-secondary);">
                ${article.content}
              </div>
              ${quotesHtml}
              ${timelineHtml}
              ${triviaHtml}
              ${relatedHtml}
            </div>
            
            <!-- Right Column Infobox -->
            <div class="wiki-sidebar-column">
              ${infoboxHtml}
            </div>
          </div>
        </div>
      `;
      // Display modal
      wikiReaderModal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // Stop background scroll

      // Award 5 Catnip Coins for reading this article for the first time
      let readArticles = [];
      try {
        readArticles = JSON.parse(localStorage.getItem('scw_read_articles') || '[]');
      } catch (e) {}
      if (!readArticles.includes(articleKey)) {
        readArticles.push(articleKey);
        try {
          localStorage.setItem('scw_read_articles', JSON.stringify(readArticles));
        } catch (e) {}
        
        setTimeout(() => {
          if (typeof addCoins === 'function') {
            addCoins(5, targetEl);
          }
        }, 150);
      }
    }
  });

  // Close reader modal
  function closeWikiReader() {
    wikiReaderModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore background scroll
    wikiReaderBody.innerHTML = '';
  }

  wikiReaderClose.addEventListener('click', closeWikiReader);
  wikiReaderModal.addEventListener('click', (e) => {
    if (e.target === wikiReaderModal) {
      closeWikiReader();
    }
  });

  // ==================== INTERACTIVE WORLD MAP SYSTEM ====================
  const mapLocations = {
    'catnip-forest': {
      title: '🌿 Catnip Forest',
      story: 'A vast, mythical woodland where the magical raw catnip crystals first germinated. The forest is dense, protected by ancient spiritual guards, and holds wild properties that give felines extra agility.',
      characters: [
        { emoji: '🐱', name: 'Ranger Barnaby', desc: 'The sentinel guardian of the sacred crystal grove.' },
        { emoji: '🦊', name: 'Sly Paw', desc: 'A wild scout familiar with hidden shortcuts through the thickets.' }
      ],
      timeline: [
        { era: 'Pre-History', desc: 'Felines discover the glowing raw crystals.' },
        { era: 'Year 12 AC', desc: 'Catnip Forest is designated as a protected sanctuary.' }
      ],
      connections: [
        { id: 'scw', name: 'Super Cat World' },
        { id: 'wwc', name: 'World War Catnip' }
      ],
      wikiLink: 'catnip-forest'
    },
    'wwc': {
      title: '⚔️ World War Catnip',
      story: 'The scarred, historic region where the Great Feline factions fought for control over the gravity crystals. It serves as a reminder of the times before unity and holds ruins filled with combat trials.',
      characters: [
        { emoji: '😾', name: 'General Whiskers', desc: 'The legendary leader who negotiated the final peace treaty.' },
        { emoji: '😼', name: 'Sergeant Claw', desc: 'A veteran soldier who fought during the siege of the central ruins.' }
      ],
      timeline: [
        { era: 'Year 0 AC', desc: 'The Great Faction wars break out over crystal extraction.' },
        { era: 'Year 6 AC', desc: 'The treaty of the Golden Collar is signed, establishing peace.' }
      ],
      connections: [
        { id: 'catnip-forest', name: 'Catnip Forest' },
        { id: 'scw', name: 'Super Cat World' },
        { id: 'kart-speedway', name: 'Kart Speedway' },
        { id: 'smash-arena', name: 'Smash Arena' }
      ],
      wikiLink: 'feline-faction-war'
    },
    'scw': {
      title: '🏰 Super Cat World',
      story: 'The floating sky kingdoms held aloft by massive gravity-defying core crystals. This space is full of high-elevation platforms, cloud cities, and challenging physics trials.',
      characters: [
        { emoji: '😸', name: 'Pilot Mew', desc: 'A sky captain navigating the trade routes between floating castles.' },
        { emoji: '🧙', name: 'Mystic Glimmer', desc: 'An elder mage researching gravity manipulation heights.' }
      ],
      timeline: [
        { era: 'Year 350 BC', desc: 'Feline pioneers discover the floating sky islands and settle there, establishing the first skyward camps using gravity-defying core shards.' },
        { era: 'Year 35 AC', desc: 'The Sky Arena is built for the global physics trials tournament.' }
      ],
      connections: [
        { id: 'catnip-forest', name: 'Catnip Forest' },
        { id: 'wwc', name: 'World War Catnip' },
        { id: 'kingdom', name: 'Catnip Kingdom' },
        { id: 'smash-arena', name: 'Smash Arena' }
      ],
      wikiLink: 'super-cat-world'
    },
    'kingdom': {
      title: '👑 Catnip Kingdom',
      story: 'The magnificent, golden capital city of the feline civilization. Built around the Great Temple of Gravity, the kingdom acts as the central hub of trade, education, and development.',
      characters: [
        { emoji: '👑', name: 'King Leopold', desc: 'The wise ruler guiding the kingdom into the cosmic age.' },
        { emoji: '🎓', name: 'Professor Purr', desc: 'Chief scientist at the Catnip Research Facility.' }
      ],
      timeline: [
        { era: 'Year 8 AC', desc: 'The first stone of the Golden Palace is laid.' },
        { era: 'Year 15 AC', desc: 'The Grand Library of Lore is opened to the public.' }
      ],
      connections: [
        { id: 'scw', name: 'Super Cat World' },
        { id: 'kart-speedway', name: 'Kart Speedway' }
      ],
      wikiLink: 'catnip-kingdom'
    },
    'kart-speedway': {
      title: '🏎️ Kart Speedway',
      story: 'The grand racing capital of the Nine Realms. Built as a state-of-the-art grand prix circuit, the speedway features magnetic gravity loops, high-velocity drift corners, and glowing turbo pads where feline racers compete at absolute top speeds.',
      characters: [
        { emoji: '😼', name: 'Racer Speedy', desc: 'The legendary cup champion and current speedway track record holder.' },
        { emoji: '🔧', name: 'Mechanic Whisk', desc: 'The chief developer of custom racing engines and aerodynamic karts.' }
      ],
      timeline: [
        { era: 'Year 18 AC', desc: 'The Allied Feline Council commissions the creation of a global racing hub to train cats in the art of fast racing.' },
        { era: 'Year 22 AC', desc: 'The inaugural Grand Cup tournament is held, drawing spectators from all realms.' }
      ],
      connections: [
        { id: 'kingdom', name: 'Catnip Kingdom' },
        { id: 'wwc', name: 'World War Catnip' }
      ],
      wikiLink: 'catnip-kart'
    },
    'smash-arena': {
      title: '💥 Super Smash Cats Arena',
      story: 'The chaotic combat stadium suspended over the central rifts. Feline gladiators from all factions assemble here to test their brawler skills in fast-paced combat, dodging weapon drops and challenging bosses like the Rat King.',
      characters: [
        { emoji: '😼', name: 'Brawler Clawz', desc: 'The reigning arena champion who specializes in spinning attacks.' },
        { emoji: '🐭', name: 'Rat King', desc: 'The ancient throne usurper who periodically raids the arena with his rat legions.' }
      ],
      timeline: [
        { era: 'Year 10 AC', desc: 'The Central Arena is built to channel faction rivalry into sanctioned athletic tournaments.' },
        { era: 'Year 25 AC', desc: 'The Rat King establishes his subterranean tunnels directly underneath the arena floor.' }
      ],
      connections: [
        { id: 'scw', name: 'Super Cat World' },
        { id: 'wwc', name: 'World War Catnip' }
      ],
      wikiLink: 'super-smash-cats'
    }
  };

  function selectMapLocation(locationId) {
    const loc = mapLocations[locationId];
    if (!loc) return;

    // Trigger territory discovery reward
    discoverTerritory(locationId);

    // Play region audio synth
    playRegionAmbience(locationId);

    // Remove active styles from all pins
    document.querySelectorAll('.map-pin').forEach(pin => {
      pin.classList.remove('active-pin');
      const core = pin.querySelector('.pin-core');
      if (core) {
        core.style.transform = 'scale(1)';
        core.style.filter = '';
      }
    });

    // Add active styles to selected pin
    const activePin = document.getElementById('pin-' + locationId);
    if (activePin) {
      activePin.classList.add('active-pin');
      const core = activePin.querySelector('.pin-core');
      if (core) {
        core.style.transform = 'scale(1.4)';
        core.style.filter = 'drop-shadow(0 0 8px currentColor)';
      }
    }

    const placeholder = document.getElementById('panel-placeholder');
    const content = document.getElementById('panel-content');

    if (placeholder) placeholder.style.display = 'none';
    if (content) {
      content.style.display = 'block';
      content.innerHTML = `
        <h3 style="font-family: var(--font-headings); font-weight: 800; border-bottom: 1px solid var(--border-light); padding-bottom: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <span>${loc.title}</span>
          <span style="font-size: 0.75rem; background: rgba(0,230,118,0.15); color: #00E676; padding: 4px 10px; border-radius: 20px; font-weight: 700;">100% Explored</span>
        </h3>
        <p style="font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 15px;">${loc.story}</p>

        <!-- Discovery Completion Bars -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: 10px; padding: 12px; margin-bottom: 15px;">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--color-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Discovery Completion</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.75rem;">
            <div style="display: flex; justify-content: space-between;"><span>Lore Archives</span><span style="color: #00E676;">100%</span></div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;"><div style="width: 100%; height: 100%; background: #00E676;"></div></div>
            <div style="display: flex; justify-content: space-between;"><span>Characters</span><span style="color: #7C4DFF;">80%</span></div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;"><div style="width: 80%; height: 100%; background: #7C4DFF;"></div></div>
            <div style="display: flex; justify-content: space-between;"><span>Secrets & Items</span><span style="color: #FFD700;">90%</span></div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;"><div style="width: 90%; height: 100%; background: #FFD700;"></div></div>
          </div>
        </div>

        ${locationId === 'wwc' ? `
          <button id="btn-replay-battle" class="btn btn-glow" style="width: 100%; margin-bottom: 15px; background: linear-gradient(135deg, #FF3D00, #FF6E40); color: #FFF; font-weight: 800; padding: 10px; border-radius: 8px; font-size: 0.85rem;">
            ▶ Replay World War Catnip Battle
          </button>
        ` : ''}
        
        <h4 style="font-size: 0.8rem; color: var(--color-primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-top: 15px; margin-bottom: 8px;">Key Characters</h4>
        <div class="panel-characters-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
          ${loc.characters.map(c => `
            <div class="panel-char-item" style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
              <span class="panel-char-emoji" style="font-size: 1.3rem;">${c.emoji}</span>
              <div class="panel-char-desc" style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4;">
                <strong style="color: #FFF;">${c.name}</strong><br>
                ${c.desc}
              </div>
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 0.8rem; color: var(--color-primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-top: 15px; margin-bottom: 8px;">History Timeline</h4>
        <div class="panel-timeline-list" style="display: flex; flex-direction: column; gap: 6px; border-left: 2px solid var(--border-light); padding-left: 12px; margin-bottom: 15px;">
          ${loc.timeline.map(t => `
            <div class="panel-time-item" style="font-size: 0.78rem; color: var(--color-text-secondary); line-height: 1.4;">
              <strong style="color: #FFF;">${t.era}</strong>: ${t.desc}
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 0.8rem; color: var(--color-primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-top: 15px; margin-bottom: 8px;">Connected Locations</h4>
        <div class="panel-connections" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          ${loc.connections.map(conn => `
            <button class="panel-conn-btn" data-conn="${conn.id}" style="background: rgba(124, 77, 255, 0.1); border: 1.5px solid var(--color-primary); color: #FFF; font-size: 0.75rem; font-weight: 700; padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;">${conn.name}</button>
          `).join('')}
        </div>

        <a href="#wiki" class="btn btn-secondary nav-trigger" data-target="wiki" data-wiki-article="${loc.wikiLink}" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; width: 100%; justify-content: center; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; padding: 10px; border-radius: 8px;">
          📚 Read Wiki Archive
        </a>
      `;

      // Bind Replay Battle button
      const replayBtn = document.getElementById('btn-replay-battle');
      if (replayBtn) {
        replayBtn.addEventListener('click', triggerBattleReplay);
      }

      // Bind connection buttons inside details panel
      content.querySelectorAll('.panel-conn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectMapLocation(btn.getAttribute('data-conn'));
          if (typeof playRetroSound === 'function') {
            playRetroSound('click');
          }
        });
      });

      // Bind dynamic wiki link inside details panel
      const wikiBtn = content.querySelector('.nav-trigger');
      if (wikiBtn) {
        wikiBtn.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo('wiki');
          
          const articleKey = wikiBtn.getAttribute('data-wiki-article');
          const article = wikiArticles[articleKey];
          if (article && wikiReaderBody && wikiReaderModal) {
            wikiPagesRead++;
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            checkAchievements();
            
            wikiReaderBody.innerHTML = `
              <div class="wiki-article-body">
                <div class="wiki-article-header">
                  <span class="wiki-tag">${article.tag}</span>
                  <h2>${article.title}</h2>
                </div>
                <div class="wiki-article-text font-readable">
                  ${article.content}
                </div>
              </div>
            `;
            wikiReaderModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
          }
        });
      }
    }
  }

  // ==================== DISCOVERY & REWARDS SYSTEM ====================
  function discoverTerritory(locationId) {
    let discovered = [];
    try {
      discovered = JSON.parse(localStorage.getItem('scw_discovered_territories') || '[]');
    } catch (e) {
      discovered = [];
    }

    if (!discovered.includes(locationId)) {
      discovered.push(locationId);
      localStorage.setItem('scw_discovered_territories', JSON.stringify(discovered));

      // Award XP & Coins
      userCoins += 15;
      totalCoinsEarned += 15;
      userXP += 25;
      if (typeof updateCoinUI === 'function') updateCoinUI();
      if (typeof updateXPUI === 'function') updateXPUI();
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();

      const toast = document.getElementById('map-discovery-toast');
      const toastText = document.getElementById('map-discovery-toast-text');
      if (toast && toastText) {
        toastText.textContent = `New Territory Discovered! +25 XP +15 Coins`;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
      }

      if (discovered.length >= 6) {
        if (!achievements.includes('master_explorer')) {
          achievements.push('master_explorer');
          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
          if (typeof showAchievementToast === 'function') {
            showAchievementToast('Master Explorer', '🏆', '+50 Coins, "Master Explorer" Title');
          }
        }
      }
    }
  }

  // ==================== HISTORICAL ERAS SYSTEM ====================
  function setMapEra(eraId) {
    const eraElements = document.querySelectorAll('[data-era]');
    eraElements.forEach(el => {
      const allowedEras = el.getAttribute('data-era').split(',');
      if (allowedEras.includes(eraId)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  const eraSelect = document.getElementById('map-era-select');
  if (eraSelect) {
    eraSelect.addEventListener('change', (e) => {
      setMapEra(e.target.value);
    });
  }

  // ==================== ANIMATED BATTLE REPLAY SYSTEM ====================
  function triggerBattleReplay() {
    const battleLayer = document.getElementById('map-battle-replay-layer');
    const treatyPin = document.getElementById('battle-treaty-pin');
    if (!battleLayer) return;

    battleLayer.style.display = 'block';
    if (treatyPin) treatyPin.style.display = 'none';

    // Fly camera to World War Catnip coordinates (620, 180)
    flyToCoordinates(620, 180, 400, 250);

    setTimeout(() => {
      if (treatyPin) treatyPin.style.display = 'block';
    }, 4000);
  }

  // ==================== OVERLAY TOGGLES ====================
  function setupOverlayToggle(btnId, layerId) {
    const btn = document.getElementById(btnId);
    const layer = document.getElementById(layerId);
    if (!btn || !layer) return;

    btn.addEventListener('click', () => {
      const isActive = layer.style.display !== 'none';
      layer.style.display = isActive ? 'none' : 'block';
      if (isActive) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      } else {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-secondary');
      }
    });
  }

  setupOverlayToggle('btn-map-overlay-gravity', 'map-gravity-streams');
  setupOverlayToggle('btn-map-overlay-crystals', 'map-crystal-layer');
  setupOverlayToggle('btn-map-overlay-transit', 'map-transit-layer');
  setupOverlayToggle('btn-map-overlay-story', 'map-story-layer');

  // ==================== DAY / NIGHT SYSTEM ====================
  const mapViewport = document.getElementById('map-viewport');
  const btnNight = document.getElementById('btn-map-toggle-night');
  if (btnNight && mapViewport) {
    btnNight.addEventListener('click', () => {
      const isNight = mapViewport.classList.toggle('map-night-mode');
      btnNight.textContent = isNight ? '☀️ Day' : '🌙 Night';
    });
  }

  // ==================== SEARCH & ZOOM ENGINE ====================
  const mapSearchInput = document.getElementById('map-search-input');
  const svgMap = document.getElementById('map-svg');

  function flyToCoordinates(cx, cy, width = 400, height = 250) {
    if (!svgMap) return;
    const targetViewBox = `${cx - width / 2} ${cy - height / 2} ${width} ${height}`;
    svgMap.style.transition = 'viewBox 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    svgMap.setAttribute('viewBox', targetViewBox);
  }

  function resetMapZoom() {
    if (!svgMap) return;
    svgMap.setAttribute('viewBox', '0 0 800 500');
  }

  if (mapSearchInput) {
    mapSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        resetMapZoom();
        return;
      }

      // Check coordinates match (e.g. 400,350)
      if (query.includes(',')) {
        const parts = query.split(',').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          flyToCoordinates(parts[0], parts[1]);
          return;
        }
      }

      // Search location titles & characters
      for (const [id, loc] of Object.entries(mapLocations)) {
        if (loc.title.toLowerCase().includes(query) || loc.story.toLowerCase().includes(query)) {
          selectMapLocation(id);
          const pin = document.getElementById('pin-' + id);
          if (pin) {
            const transform = pin.getAttribute('transform') || '';
            const coordsStr = transform.replace('translate(', '').replace(')', '');
            const parts = coordsStr.split(',');
            if (parts.length === 2 && !isNaN(parseFloat(parts[0]))) {
              flyToCoordinates(parseFloat(parts[0]), parseFloat(parts[1]));
            }
          }
          return;
        }
      }
    });
  }

  const btnZoomIn = document.getElementById('btn-map-zoom-in');
  const btnZoomOut = document.getElementById('btn-map-zoom-out');
  const btnZoomReset = document.getElementById('btn-map-zoom-reset');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => flyToCoordinates(400, 250, 450, 280));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => flyToCoordinates(400, 250, 750, 470));
  if (btnZoomReset) btnZoomReset.addEventListener('click', resetMapZoom);

  // ==================== NPC BADGES BINDING ====================
  document.querySelectorAll('.npc-pin-badge').forEach(npc => {
    npc.addEventListener('click', (e) => {
      e.stopPropagation();
      const articleKey = npc.getAttribute('data-wiki');
      if (articleKey && typeof navigateTo === 'function') {
        navigateTo('wiki');
        const article = wikiArticles[articleKey];
        if (article && wikiReaderBody && wikiReaderModal) {
          wikiReaderBody.innerHTML = `
            <div class="wiki-article-body">
              <div class="wiki-article-header">
                <span class="wiki-tag">${article.tag}</span>
                <h2>${article.title}</h2>
              </div>
              <div class="wiki-article-text font-readable">
                ${article.content}
              </div>
            </div>
          `;
          wikiReaderModal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    });
  });

  // ==================== WEB AUDIO REGION SYNTH ====================
  let regionAudioCtx = null;

  function playRegionAmbience(locationId) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!regionAudioCtx) {
        regionAudioCtx = new AudioCtx();
      }
      if (regionAudioCtx.state === 'suspended') {
        regionAudioCtx.resume();
      }

      const now = regionAudioCtx.currentTime;
      let baseFreq = 220;
      let waveType = 'sine';

      if (locationId === 'catnip-forest') { baseFreq = 329.63; waveType = 'sine'; }
      else if (locationId === 'kingdom') { baseFreq = 440.00; waveType = 'triangle'; }
      else if (locationId === 'wwc') { baseFreq = 146.83; waveType = 'sawtooth'; }
      else if (locationId === 'kart-speedway') { baseFreq = 523.25; waveType = 'square'; }
      else if (locationId === 'smash-arena') { baseFreq = 220.00; waveType = 'sawtooth'; }
      else if (locationId === 'scw') { baseFreq = 587.33; waveType = 'sine'; }

      [1, 1.5].forEach((mult, i) => {
        const osc = regionAudioCtx.createOscillator();
        const gain = regionAudioCtx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(baseFreq * mult, now);

        gain.gain.setValueAtTime(0.08 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

        osc.connect(gain);
        gain.connect(regionAudioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
      });
    } catch (e) {}
  }

  // ==================== AIRSHIP LORE DATABASE ====================
  const AIRSHIP_LORE_DB = {
    'catnip': {
      icon: '🛸',
      name: 'Catnip',
      year: 'Commissioned 3 BC',
      class: 'Pioneer Prototype',
      faction: 'Catnip Guild',
      desc: 'Commissioned in 3 BC by Master Alchemist Purr, the "Catnip" was the world\'s very first gravity-crystal lifting vessel. Built with lightweight bamboo ribbing and powered by a raw Refined Anticatite engine, it proved felines could conquer the skies.',
      hp: '750 HP',
      speed: '95 Knots',
      engine: 'Proto-Gravity Core'
    },
    'heavy-war-patroler': {
      icon: '🛸',
      name: 'Heavy War Patroler',
      year: 'Commissioned 3 AD',
      class: 'Armored Sky Fortress',
      faction: 'Royal Sky Defense',
      desc: 'Commissioned in 3 AD during early border skirmishes, the "Heavy War Patroler" features reinforced titanium-iron alloy plating, dual plasma defense cannons, and high-altitude optics to secure kingdom airspace.',
      hp: '1,850 HP',
      speed: '110 Knots',
      engine: 'Twin Anticatite Mk-II'
    },
    'claw-cargo-ship': {
      icon: '🛸',
      name: 'Claw Cargo Ship',
      year: 'Commissioned 35 AD',
      class: 'Heavy Freight Zeppelin',
      faction: 'Merchant Syndicate',
      desc: 'Commissioned in 35 AD to supply energy crystal trade across oceans, the "Claw Cargo Ship" is a massive twin-hulled freighter capable of hauling up to 500 tons of raw Anticatite ore across continents.',
      hp: '1,400 HP',
      speed: '85 Knots',
      engine: 'High-Torque Lift Rig'
    },
    'royal-flagship': {
      icon: '👑',
      name: 'Royal Sovereign Flagship',
      year: 'Commissioned 12 AD',
      class: 'Royal Command Vessel',
      faction: 'Golden Collar Crown',
      desc: 'Commissioned in 12 AD as King Leopold\'s personal royal flagship, the "Royal Sovereign" features gold-gilded hull armor, anti-gravity stabilizer rings, and luxurious quarters for high-altitude diplomatic summits.',
      hp: '2,200 HP',
      speed: '140 Knots',
      engine: 'Royal Celestial Core'
    },
    'red-corsair': {
      icon: '⚔️',
      name: 'Red Faction War Corsair',
      year: 'Commissioned WWC Era',
      class: 'Strike Gunship',
      faction: 'Scorched Fleet',
      desc: 'Aggressive frontline attack craft deployed by the Red Faction. Outfitted with high-speed incendiary cannons designed for naval bombardment and aerial dogfighting.',
      hp: '900 HP',
      speed: '160 Knots',
      engine: 'Overclocked Anticatite'
    },
    'blue-sentinel': {
      icon: '🛡️',
      name: 'Blue Faction Defense Sentinel',
      year: 'Commissioned WWC Era',
      class: 'Interceptor Cruiser',
      faction: 'Kingdom Defense',
      desc: 'Shield-heavy interception cruiser tasked with intercepting incoming bombardment shells and protecting ground fortifications.',
      hp: '1,100 HP',
      speed: '150 Knots',
      engine: 'Plasma Barrier Drive'
    }
  };

  function openAirshipLoreModal(shipId) {
    const data = AIRSHIP_LORE_DB[shipId] || AIRSHIP_LORE_DB['catnip'];
    const modal = document.getElementById('airship-lore-modal');
    if (!modal) return;

    document.getElementById('lore-ship-icon').textContent = data.icon;
    document.getElementById('lore-ship-name').textContent = data.name;
    document.getElementById('lore-ship-year').textContent = data.year;
    document.getElementById('lore-ship-class').textContent = data.class;
    document.getElementById('lore-ship-faction').textContent = data.faction;
    document.getElementById('lore-ship-desc').textContent = data.desc;
    document.getElementById('lore-ship-power').textContent = data.hp;
    document.getElementById('lore-ship-speed').textContent = data.speed;
    document.getElementById('lore-ship-engine').textContent = data.engine;

    modal.style.display = 'block';

    if (typeof playRegionAmbience === 'function') {
      playRegionAmbience('scw');
    }
  }

  const btnCloseLore = document.getElementById('btn-close-airship-lore');
  if (btnCloseLore) {
    btnCloseLore.addEventListener('click', () => {
      const modal = document.getElementById('airship-lore-modal');
      if (modal) modal.style.display = 'none';
    });
  }

  // Bind airships click handler directly & with event delegation
  document.querySelectorAll('[data-ship-id]').forEach(ship => {
    ship.addEventListener('click', (e) => {
      e.stopPropagation();
      const shipId = ship.getAttribute('data-ship-id');
      if (shipId) openAirshipLoreModal(shipId);
    });
  });

  // Bind map pins click handler with event delegation fallback
  document.querySelectorAll('.map-pin').forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const locationId = pin.getAttribute('data-id');
      if (locationId) selectMapLocation(locationId);
    });
  });

  if (svgMap) {
    svgMap.addEventListener('click', (e) => {
      const airship = e.target.closest('[data-ship-id]');
      if (airship) {
        const shipId = airship.getAttribute('data-ship-id');
        openAirshipLoreModal(shipId);
        return;
      }

      const pin = e.target.closest('.map-pin');
      if (pin) {
        const locationId = pin.getAttribute('data-id');
        if (locationId) selectMapLocation(locationId);
      }
    });
  }

  // Map View Mode Toggles
  const btnMapStandard = document.getElementById('btn-map-mode-standard');
  const btnMapHeight = document.getElementById('btn-map-mode-height');
  const mapHeightLegend = document.getElementById('map-height-legend');

  if (btnMapStandard && btnMapHeight && mapViewport) {
    btnMapStandard.addEventListener('click', () => {
      btnMapStandard.classList.add('btn-primary', 'active');
      btnMapStandard.classList.remove('btn-secondary');
      btnMapHeight.classList.add('btn-secondary');
      btnMapHeight.classList.remove('btn-primary', 'active');
      
      mapViewport.classList.remove('inspect-height-active');
      if (mapHeightLegend) mapHeightLegend.style.display = 'none';
    });

    btnMapHeight.addEventListener('click', () => {
      btnMapHeight.classList.add('btn-primary', 'active');
      btnMapHeight.classList.remove('btn-secondary');
      btnMapStandard.classList.add('btn-secondary');
      btnMapStandard.classList.remove('btn-primary', 'active');
      
      mapViewport.classList.add('inspect-height-active');
      if (mapHeightLegend) mapHeightLegend.style.display = 'block';
    });
  }

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeWikiReader();
      closeSecurityGate();
    }
  });

  // Autolock when leaving the tab/window (document visibility change)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const isAuth = sessionStorage.getItem('dev_auth') === 'true';
      if (isAuth) {
        // Start 1 minute lock timer if visibility is lost
        if (!devVisibilityLeaveTimer) {
          devVisibilityLeaveTimer = setTimeout(lockDevPortal, 60 * 1000);
        }
      }
    } else if (document.visibilityState === 'visible') {
      // Clear visibility lock timer if they return before 1 minute
      if (devVisibilityLeaveTimer) {
        clearTimeout(devVisibilityLeaveTimer);
        devVisibilityLeaveTimer = null;
      }
    }
  });

  // ==================== COMMUNITY LEADERBOARD ENGINE ====================

  // Parse time strings (e.g., "MM:SS.CC") into seconds for accurate comparison
  function timeStringToSeconds(timeStr) {
    if (!timeStr) return 999999;
    const cleanStr = timeStr.toString().trim();
    const parts = cleanStr.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    } else if (parts.length === 3) {
      const hrs = parseFloat(parts[0]) || 0;
      const mins = parseFloat(parts[1]) || 0;
      const secs = parseFloat(parts[2]) || 0;
      return hrs * 3600 + mins * 60 + secs;
    } else {
      return parseFloat(cleanStr) || 0;
    }
  }

  function renderLeaderboardScores(scores) {
    // Increment daily quest progress
    incrementQuestProgress('hub_leaderboard');

    const leaderboardTable = document.getElementById('leaderboard-table');
    const leaderboardTbody = document.getElementById('leaderboard-tbody');
    const leaderboardEmptyState = document.getElementById('leaderboard-empty-state');

    if (!scores || scores.length === 0) {
      if (leaderboardTable) leaderboardTable.style.display = 'none';
      if (leaderboardEmptyState) leaderboardEmptyState.style.display = 'flex';
    } else {
      if (leaderboardTable) leaderboardTable.style.display = 'table';
      if (leaderboardEmptyState) leaderboardEmptyState.style.display = 'none';

      // Sort speedrun scores: fastest time first numerically
      scores.sort((a, b) => timeStringToSeconds(a.time) - timeStringToSeconds(b.time));

      if (leaderboardTbody) {
        leaderboardTbody.innerHTML = '';
        scores.forEach((score, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>#${index + 1}</td>
            <td>${escapeHtml(score.name)}</td>
            <td><span class="status-badge ${score.mode && score.mode.includes('Hard') ? 'done-badge' : 'dev-badge'}">${escapeHtml(score.mode || 'Standard Run')}</span></td>
            <td>${escapeHtml(score.time)}</td>
            <td>${escapeHtml(score.date || 'N/A')}</td>
          `;
          leaderboardTbody.appendChild(row);
        });
      }
    }
  }

  function loadLeaderboard() {
    let localScores = [];
    try {
      localScores = JSON.parse(localStorage.getItem('scw_local_leaderboard') || '[]');
    } catch (e) {
      localScores = [];
    }

    // Default permanent record
    const defaultRun = { name: "catnip", mode: "Easy (1 Boss)", time: "20:36.00", date: new Date().toLocaleDateString() };
    const hasCatnipRun = Array.isArray(localScores) && localScores.some(s => s.name === "catnip" && s.time === "20:36.00");
    if (!hasCatnipRun) {
      if (!Array.isArray(localScores)) localScores = [];
      localScores.push(defaultRun);
    }

    // Filter duplicates locally: keep only the fastest run per unique username
    const uniqueScores = {};
    localScores.forEach(score => {
      const name = (score.name || '').trim();
      if (!name) return;
      
      const existing = uniqueScores[name];
      if (!existing) {
        uniqueScores[name] = score;
      } else {
        const currentSecs = timeStringToSeconds(score.time);
        const existingSecs = timeStringToSeconds(existing.time);
        if (currentSecs < existingSecs) {
          uniqueScores[name] = score;
        }
      }
    });

    const cleanedScores = Object.values(uniqueScores);

    // Save cleaned deduplicated list back to LocalStorage
    try {
      localStorage.setItem('scw_local_leaderboard', JSON.stringify(cleanedScores));
    } catch (e) {}

    renderLeaderboardScores(cleanedScores);

    // Award +20 coins for each new local speedrun run completed
    let lastProcessedCount = parseInt(localStorage.getItem('scw_processed_runs_count') || '1', 10);
    if (localScores.length > lastProcessedCount) {
      const newRuns = localScores.length - lastProcessedCount;
      localStorage.setItem('scw_processed_runs_count', localScores.length.toString());
      setTimeout(() => {
        if (typeof addCoins === 'function') {
          addCoins(newRuns * 20, document.querySelector('.leaderboard-card'));
        }
      }, 500);
    } else if (localScores.length < lastProcessedCount) {
      // Synchronize tracker if local scores were reset or altered
      localStorage.setItem('scw_processed_runs_count', localScores.length.toString());
    }

    // Fetch permanent cloud database entries if Firebase is initialized
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();

        // Sync local scores to cloud database if logged in
        if (firebase.auth && firebase.auth().currentUser) {
          cleanedScores.forEach(score => {
            const docId = `${score.name}_${score.mode}_${score.time}`.replace(/[^a-zA-Z0-9_]/g, '_');
            db.collection('leaderboard').doc(docId).set({
              name: score.name,
              mode: score.mode,
              time: score.time,
              date: score.date
            }).catch(err => console.warn("Failed syncing score to cloud:", err));
          });
        }

        db.collection('leaderboard').orderBy('time', 'asc').limit(50).onSnapshot((snapshot) => {
          const cloudScores = [];
          snapshot.forEach((doc) => {
            cloudScores.push(doc.data());
          });
          
          // Filter duplicates: keep only the fastest run per unique username
          const uniqueCloud = {};
          
          // Seed with local scores so offline & un-synced runs are preserved
          cleanedScores.forEach(score => {
            uniqueCloud[score.name] = score;
          });

          cloudScores.forEach(score => {
            const name = (score.name || '').trim();
            if (!name) return;
            const existing = uniqueCloud[name];
            if (!existing) {
              uniqueCloud[name] = score;
            } else {
              const currentSecs = timeStringToSeconds(score.time);
              const existingSecs = timeStringToSeconds(existing.time);
              if (currentSecs < existingSecs) {
                uniqueCloud[name] = score;
              }
            }
          });
          
          const cleanedCloud = Object.values(uniqueCloud);
          if (cleanedCloud.length > 0) {
            renderLeaderboardScores(cleanedCloud);
          }
        }, (err) => {
          console.warn("Firestore leaderboard offline / standard mode:", err);
        });
      } catch (e) {
        console.warn("Cloud Firestore init info:", e);
      }
    }
    if (typeof updateExchangeTerminal === 'function') {
      updateExchangeTerminal();
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial leaderboard load
  loadLeaderboard();

  // ==================== FIREBASE AUTH & USER PROFILES ====================
  // Safe Firebase Initialization
  let firebaseAuth = null;
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firebaseAuth = firebase.auth();
    } catch (err) {
      console.warn("Firebase Auth init warning:", err);
    }
  }

  // DOM Elements for Auth
  const accountNavTrigger = document.getElementById('account-nav-trigger');
  const accountNavLabel = document.getElementById('account-nav-label');
  const authModal = document.getElementById('auth-modal');
  const authModalClose = document.getElementById('auth-modal-close');
  const authLoggedOutView = document.getElementById('auth-logged-out-view');
  const authLoggedInView = document.getElementById('auth-logged-in-view');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const loginFeedback = document.getElementById('login-feedback');
  const regFeedback = document.getElementById('reg-feedback');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileEmail = document.getElementById('profile-email');
  const btnSignOut = document.getElementById('btn-sign-out');

  function openAuthModal() {
    if (authModal) authModal.style.display = 'flex';
  }

  function closeAuthModal() {
    if (authModal) authModal.style.display = 'none';
    if (loginFeedback) loginFeedback.innerHTML = '';
    if (regFeedback) regFeedback.innerHTML = '';
  }

  if (accountNavTrigger) accountNavTrigger.addEventListener('click', openAuthModal);
  if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Tab switching inside Auth Modal
  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      formLogin.classList.add('active');
      formRegister.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      formRegister.classList.add('active');
      formLogin.classList.remove('active');
    });
  }

  // Update Auth State UI
  function updateAuthStateUI(user) {
    if (user) {
      // User is logged in
      const displayName = user.displayName || user.email.split('@')[0];
      if (accountNavLabel) accountNavLabel.textContent = `🐱 ${displayName}`;
      if (accountNavTrigger) accountNavTrigger.classList.add('logged-in');

      if (authLoggedOutView) authLoggedOutView.style.display = 'none';
      if (authLoggedInView) authLoggedInView.style.display = 'block';
      if (profileDisplayName) profileDisplayName.textContent = displayName;
      if (profileEmail) profileEmail.textContent = user.email;

      // Automatically unlock Dev Portal if user is the dev (catnip)
      const localEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
      const isDevSession = isDeveloperEmail(localEmail) || sessionStorage.getItem('dev_auth') === 'true';
      if (isDevSession) {
        unlockDevPortalUI();
        
        // Baseline 200+ XP for owner and staff accounts
        if (userXP < 200) {
          userXP = 200;
          let tempXP = userXP;
          let newLevel = 1;
          while (true) {
            const needed = getXPNeededForLevel(newLevel);
            if (tempXP >= needed) {
              tempXP -= needed;
              newLevel++;
            } else {
              break;
            }
          }
          userLevel = newLevel;
          checkUnlockedTitles(userLevel);
          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
          updateXPUI();
        }
      }
    } else {
      // User is logged out
      if (accountNavLabel) accountNavLabel.textContent = 'Sign In';
      if (accountNavTrigger) accountNavTrigger.classList.remove('logged-in');

      if (authLoggedOutView) authLoggedOutView.style.display = 'block';
      if (authLoggedInView) authLoggedInView.style.display = 'none';

      // Lock Dev Portal
      lockDevPortal();
    }
    if (typeof applyActiveCosmetics === 'function') {
      applyActiveCosmetics();
    }
    if (typeof updateExchangeTerminal === 'function') {
      updateExchangeTerminal();
    }
    if (user && typeof showExchangeConfirmationModal === 'function') {
      const pendingSCW = parseInt(localStorage.getItem('scw_pending_claim_coins') || '0', 10);
      const pendingSSC = parseInt(localStorage.getItem('ssc_pending_claim_coins') || '0', 10);
      
      if (pendingSCW > 0) {
        localStorage.removeItem('scw_pending_claim_coins');
        const reward = Math.floor(pendingSCW / 5);
        setTimeout(() => {
          showExchangeConfirmationModal(pendingSCW, reward, 'scw');
        }, 1200);
      } else if (pendingSSC > 0) {
        localStorage.removeItem('ssc_pending_claim_coins');
        setTimeout(() => {
          showExchangeConfirmationModal(0, pendingSSC, 'ssc');
        }, 1200);
      } else {
        const pendingCAU = parseInt(localStorage.getItem('cau_pending_claim_coins') || '0', 10);
        const pendingCAURole = localStorage.getItem('cau_pending_claim_role') || 'innocent';
        const pendingCAUExtra = parseInt(localStorage.getItem('cau_pending_claim_extra') || '0', 10);
        if (pendingCAU > 0) {
          localStorage.removeItem('cau_pending_claim_coins');
          localStorage.removeItem('cau_pending_claim_role');
          localStorage.removeItem('cau_pending_claim_extra');
          activeCauRole = pendingCAURole;
          activeCauExtraCats = pendingCAUExtra;
          setTimeout(() => {
            showExchangeConfirmationModal(0, pendingCAU, 'cau');
          }, 1200);
        }
      }
    }
  }

  // Listen to Firebase Auth state
  if (firebaseAuth) {
    firebaseAuth.onAuthStateChanged((user) => {
      updateAuthStateUI(user);
      if (user) {
        // Sync coin balance and cosmetics from Firestore
        if (typeof firebase !== 'undefined' && firebase.firestore) {
          const db = firebase.firestore();
          db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
              const data = doc.data();
              if (typeof data.coins === 'number') userCoins = data.coins;
              if (Array.isArray(data.ownedItems)) ownedItems = data.ownedItems;
              if (Array.isArray(data.activeCosmetics)) activeCosmetics = data.activeCosmetics;
              if (typeof data.lastClaimTimestamp === 'number') lastClaimTimestamp = data.lastClaimTimestamp;
              
              if (data.avatarCat) avatarCat = data.avatarCat;
              if (data.avatarExpression) avatarExpression = data.avatarExpression;
              if (data.avatarFrame) avatarFrame = data.avatarFrame;
              if (Array.isArray(data.unlockedCats)) unlockedCats = data.unlockedCats;
              if (Array.isArray(data.unlockedFrames)) unlockedFrames = data.unlockedFrames;
              if (data.joinDate) joinDate = data.joinDate;
              if (typeof data.totalCoinsEarned === 'number') totalCoinsEarned = data.totalCoinsEarned;
              if (typeof data.gamesPlayed === 'number') gamesPlayed = data.gamesPlayed;
              if (typeof data.victoryCount === 'number') victoryCount = data.victoryCount;
              if (data.favouriteGame) favouriteGame = data.favouriteGame;
              if (Array.isArray(data.achievements)) achievements = data.achievements;
              if (typeof data.ratKillsCount === 'number') ratKillsCount = data.ratKillsCount;
              if (typeof data.wikiPagesRead === 'number') wikiPagesRead = data.wikiPagesRead;
              if (typeof data.hoursPlayed === 'number') hoursPlayed = data.hoursPlayed;
              if (typeof data.journalStreak === 'number') journalStreak = data.journalStreak;
              if (typeof data.loginStreak === 'number') loginStreak = data.loginStreak;
              if (typeof data.coinsSpent === 'number') coinsSpent = data.coinsSpent;
              if (data.activeTitle) activeTitle = data.activeTitle;
              if (Array.isArray(data.unlockedTitles)) unlockedTitles = data.unlockedTitles;
              if (typeof data.userXP === 'number') userXP = data.userXP;
              if (typeof data.userLevel === 'number') userLevel = data.userLevel;
              if (typeof data.userPrestige === 'number') userPrestige = data.userPrestige;
              if (typeof updateXPUI === 'function') updateXPUI();
              
              updateCoinUI();
              applyActiveCosmetics();
              renderShopItems();
              updateChestUI();
              saveCoinsToLocalStorage();
              renderProfileCustoms(user);
              checkAchievements();
            } else {
              // Create user doc in Firestore
              syncCoinsToFirestore();
              renderProfileCustoms(user);
              checkAchievements();
            }
          }).catch(err => {
            console.warn("Error getting user coins doc:", err);
          });
        }
      } else {
        // Guest/Local fallback user: restore local storage settings
        const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
        if (savedUser) {
          updateAuthStateUI(savedUser);
          
          const isDev = savedUser.email && isDeveloperEmail(savedUser.email);
          if (isDev) {
            loadCoinsFromLocalStorage();
            if (localStorage.getItem('scw_coins_balance') === null) {
              userCoins = 9999;
              saveCoinsToLocalStorage();
            }
            const devCosmetics = ["golden-name", "purple-border", "crown-badge", "sound-pack"];
            devCosmetics.forEach(item => {
              if (!ownedItems.includes(item)) ownedItems.push(item);
              if (!activeCosmetics.includes(item)) activeCosmetics.push(item);
            });
            updateCoinUI();
            applyActiveCosmetics();
            renderShopItems();
            updateChestUI();
          } else {
            loadCoinsFromLocalStorage();
          }
          renderProfileCustoms(savedUser);
          checkAchievements();
        } else {
          updateAuthStateUI(null);
          loadCoinsFromLocalStorage();
        }
      }
    });
  }

  // Handle Register Form Submit
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      if (email.toLowerCase() === 'dev@catnipstudios.com') {
        triggerLockdown();
        return;
      }

      regFeedback.innerHTML = '<span style="color: #00E676;">Creating user account...</span>';

      const isEmail = email.includes('@');

      if (firebaseAuth && isEmail && !isMockKey) {
        try {
          const userCred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
          await userCred.user.updateProfile({ displayName: username });
          regFeedback.innerHTML = '<span style="color: #00E676;">Account created successfully!</span>';
          setTimeout(closeAuthModal, 800);
        } catch (err) {
          const isFallbackError = !err.code || 
            err.code.includes('key') || 
            err.code.includes('invalid') || 
            err.code.includes('config') || 
            err.code.includes('network') || 
            (err.message && (err.message.includes('API key') || err.message.includes('api-key')));

          if (isFallbackError) {
            const mockUser = { displayName: username, email: email, uid: 'user-' + Date.now() };
            localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
            if (typeof saveToLocalProfilesDatabase === 'function') {
              saveToLocalProfilesDatabase(username, email, 0, []);
            }
            updateAuthStateUI(mockUser);
            regFeedback.innerHTML = '<span style="color: #00E676;">Account created successfully!</span>';
            setTimeout(closeAuthModal, 800);
          } else {
            regFeedback.innerHTML = `<span style="color: #FF5252;">${err.message}</span>`;
          }
        }
      } else {
        // Fallback session mode
        const mockUser = { displayName: username, email: email, uid: 'user-' + Date.now() };
        localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
        if (typeof saveToLocalProfilesDatabase === 'function') {
          saveToLocalProfilesDatabase(username, email, 0, []);
        }
        updateAuthStateUI(mockUser);
        regFeedback.innerHTML = '<span style="color: #00E676;">Account created!</span>';
        setTimeout(closeAuthModal, 800);
      }
    });
  }

  // Handle Login Form Submit
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (email.toLowerCase() === 'dev@catnipstudios.com') {
        triggerLockdown();
        return;
      }

      loginFeedback.innerHTML = '<span style="color: #00E676;">Authenticating...</span>';

      const isEmail = email.includes('@');

      if (firebaseAuth && isEmail && !isMockKey) {
        try {
          await firebaseAuth.signInWithEmailAndPassword(email, password);
          loginFeedback.innerHTML = '<span style="color: #00E676;">Welcome back!</span>';
          setTimeout(closeAuthModal, 800);
        } catch (err) {
          const isFallbackError = !err.code || 
            err.code.includes('key') || 
            err.code.includes('invalid') || 
            err.code.includes('config') || 
            err.code.includes('network') || 
            (err.message && (err.message.includes('API key') || err.message.includes('api-key')));

          if (isFallbackError) {
            const mockUser = { displayName: email.split('@')[0], email: email, uid: 'user-' + Date.now() };
            localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
            
            // Check if there are existing coins/items in database to load
            let existingCoins = 0;
            let existingItems = [];
            if (isDeveloperEmail(email)) {
              let stored = -1;
              try {
                const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
                const matched = localDb.find(u => u.email === email);
                if (matched) stored = matched.coins;
              } catch(e) {}
              existingCoins = stored === -1 ? 9999 : stored;
              existingItems = ["golden-name", "purple-border", "crown-badge", "sound-pack"];
              try {
                const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
                const matched = localDb.find(u => u.email === email);
                if (matched && Array.isArray(matched.cosmetics)) {
                  matched.cosmetics.forEach(c => {
                    if (!existingItems.includes(c)) existingItems.push(c);
                  });
                }
              } catch(e) {}
            } else {
              try {
                const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
                const matched = localDb.find(u => u.email === email);
                if (matched) {
                  existingCoins = matched.coins || 0;
                  existingItems = matched.cosmetics || [];
                  
                  if (matched.avatarCat) avatarCat = matched.avatarCat;
                  if (matched.avatarExpression) avatarExpression = matched.avatarExpression;
                  if (matched.avatarFrame) avatarFrame = matched.avatarFrame;
                  if (Array.isArray(matched.unlockedCats)) unlockedCats = matched.unlockedCats;
                  if (Array.isArray(matched.unlockedFrames)) unlockedFrames = matched.unlockedFrames;
                  if (matched.joinDate) joinDate = matched.joinDate;
                  if (typeof matched.totalCoinsEarned === 'number') totalCoinsEarned = matched.totalCoinsEarned;
                  if (typeof matched.gamesPlayed === 'number') gamesPlayed = matched.gamesPlayed;
                  if (typeof matched.victoryCount === 'number') victoryCount = matched.victoryCount;
                  if (matched.favouriteGame) favouriteGame = matched.favouriteGame;
                  if (Array.isArray(matched.achievements)) achievements = matched.achievements;
                  if (typeof matched.ratKillsCount === 'number') ratKillsCount = matched.ratKillsCount;
                  if (typeof matched.wikiPagesRead === 'number') wikiPagesRead = matched.wikiPagesRead;
                  if (matched.activeTitle) activeTitle = matched.activeTitle;
                  if (Array.isArray(matched.unlockedTitles)) unlockedTitles = matched.unlockedTitles;
                }
              } catch(e) {}
            }
            
            userCoins = existingCoins;
            ownedItems = existingItems;
            activeCosmetics = [...existingItems]; // auto-equip
            updateCoinUI();
            applyActiveCosmetics();
            renderShopItems();
            updateChestUI();
            saveCoinsToLocalStorage();
            
            if (typeof saveToLocalProfilesDatabase === 'function') {
              saveToLocalProfilesDatabase(mockUser.displayName, email, userCoins, ownedItems);
            }
            updateAuthStateUI(mockUser);
            loginFeedback.innerHTML = '<span style="color: #00E676;">Welcome back!</span>';
            setTimeout(closeAuthModal, 800);
          } else {
            loginFeedback.innerHTML = `<span style="color: #FF5252;">${err.message}</span>`;
          }
        }
      } else {
        // Fallback session mode
        const mockUser = { displayName: email.split('@')[0], email: email, uid: 'user-' + Date.now() };
        localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
        
        let existingCoins = 0;
        let existingItems = [];
        if (isDeveloperEmail(email)) {
          let stored = -1;
          try {
            const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
            const matched = localDb.find(u => u.email === email);
            if (matched) stored = matched.coins;
          } catch(e) {}
          existingCoins = stored === -1 ? 9999 : stored;
          existingItems = ["golden-name", "purple-border", "crown-badge", "sound-pack"];
          try {
            const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
            const matched = localDb.find(u => u.email === email);
            if (matched && Array.isArray(matched.cosmetics)) {
              matched.cosmetics.forEach(c => {
                if (!existingItems.includes(c)) existingItems.push(c);
              });
            }
          } catch(e) {}
        } else {
          try {
            const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
            const matched = localDb.find(u => u.email === email);
            if (matched) {
              existingCoins = matched.coins || 0;
              existingItems = matched.cosmetics || [];
              
              if (matched.avatarCat) avatarCat = matched.avatarCat;
              if (matched.avatarExpression) avatarExpression = matched.avatarExpression;
              if (matched.avatarFrame) avatarFrame = matched.avatarFrame;
              if (Array.isArray(matched.unlockedCats)) unlockedCats = matched.unlockedCats;
              if (Array.isArray(matched.unlockedFrames)) unlockedFrames = matched.unlockedFrames;
              if (matched.joinDate) joinDate = matched.joinDate;
              if (typeof matched.totalCoinsEarned === 'number') totalCoinsEarned = matched.totalCoinsEarned;
              if (typeof matched.gamesPlayed === 'number') gamesPlayed = matched.gamesPlayed;
              if (typeof matched.victoryCount === 'number') victoryCount = matched.victoryCount;
              if (matched.favouriteGame) favouriteGame = matched.favouriteGame;
              if (Array.isArray(matched.achievements)) achievements = matched.achievements;
            }
          } catch(e) {}
        }
        
        userCoins = existingCoins;
        ownedItems = existingItems;
        activeCosmetics = [...existingItems];
        updateCoinUI();
        applyActiveCosmetics();
        renderShopItems();
        updateChestUI();
        saveCoinsToLocalStorage();
        
        if (typeof saveToLocalProfilesDatabase === 'function') {
          saveToLocalProfilesDatabase(mockUser.displayName, email, userCoins, ownedItems);
        }
        updateAuthStateUI(mockUser);
        loginFeedback.innerHTML = '<span style="color: #00E676;">Signed in!</span>';
        setTimeout(closeAuthModal, 800);
      }
    });
  }

  // Handle Sign Out
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      localStorage.removeItem('scw_local_user');
      if (firebaseAuth) {
        try {
          firebaseAuth.signOut().catch(() => {});
        } catch (e) {}
      }
      updateAuthStateUI(null);
      // Reset local coins and cosmetics to Guest defaults
      userCoins = 0;
      ownedItems = [];
      activeCosmetics = [];
      lastClaimTimestamp = 0;
      saveCoinsToLocalStorage();
      updateCoinUI();
      applyActiveCosmetics();
      renderShopItems();
      updateChestUI();
      if (typeof loadUserDirectory === 'function') {
        loadUserDirectory();
      }
      closeAuthModal();
    });
  }

  // Initial check for offline / fallback mode
  if (!firebaseAuth) {
    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    if (savedUser) {
      loadCoinsFromLocalStorage();
      updateAuthStateUI(savedUser);
      const isDev = savedUser.email && isDeveloperEmail(savedUser.email);
      if (isDev) {
        if (localStorage.getItem('scw_coins_balance') === null) {
          userCoins = 9999;
          saveCoinsToLocalStorage();
        }
        const devCosmetics = ["golden-name", "purple-border", "crown-badge", "sound-pack"];
        devCosmetics.forEach(item => {
          if (!ownedItems.includes(item)) ownedItems.push(item);
          if (!activeCosmetics.includes(item)) activeCosmetics.push(item);
        });
        updateCoinUI();
        applyActiveCosmetics();
        renderShopItems();
        updateChestUI();
      }
      renderProfileCustoms(savedUser);
      checkAchievements();
    }
  }

  // ==================== THE STRESS OF THE GAME(S) JOURNAL LISTENER ====================
  const journalInput = document.getElementById('journal-input');
  const btnAddJournal = document.getElementById('btn-add-journal');

  if (btnAddJournal && journalInput) {
    btnAddJournal.addEventListener('click', () => {
      const noteText = journalInput.value.trim();
      if (!noteText) {
        alert("Please enter a reflection note before publishing!");
        return;
      }

      const newEntry = {
        text: noteText,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };

      let savedEntries = [];
      try {
        savedEntries = JSON.parse(localStorage.getItem('scw_stress_journal') || '[]');
      } catch (e) {
        savedEntries = [];
      }

      savedEntries.push(newEntry);
      localStorage.setItem('scw_stress_journal', JSON.stringify(savedEntries));

      // Save permanently to Cloud Firestore if available
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          firebase.firestore().collection('stress_reflections').add(newEntry);
        } catch (e) {}
      }

      journalInput.value = '';
      displayJournalEntries(savedEntries);

      alert("🎉 Reflection note permanently published to your Developer Secrets journal!");
    });
  }

  // ==================== CATNIP COINS & SHOP ENGINE ====================

  // Sound Synth Utility (Dynamic Web Audio API)
  function playRetroSound(type) {
    if (!ownedItems.includes('sound-pack') || !activeCosmetics.includes('sound-pack')) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      const now = audioCtx.currentTime;
      if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.07);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'purchase') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'chest') {
        osc.type = 'square';
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        });
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch(e) {
      console.warn("AudioContext block:", e);
    }
  }

  // Floating Coins Popup
  function showFloatingCoins(amount, element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + window.scrollX;
    const y = rect.top + window.scrollY;

    const popup = document.createElement('div');
    popup.className = 'floating-coin-popup';
    popup.innerHTML = `+${amount} <img src="coin.png" style="width: 20px; height: 20px;" />`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.remove();
    }, 1200);
  }

  // Helper to save offline profiles to local database
  function saveToLocalProfilesDatabase(username, email, coins = 0, cosmetics = []) {
    let localDb = [];
    try {
      localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
    } catch(e) {}
    
    if (!Array.isArray(localDb)) {
      localDb = [];
    }
    
    const existingIdx = localDb.findIndex(u => u.email === email);
    const profile = {
      username: username,
      email: email,
      coins: coins,
      cosmetics: cosmetics,
      status: "Offline",
      avatarCat: avatarCat,
      avatarExpression: avatarExpression,
      avatarFrame: avatarFrame,
      unlockedCats: unlockedCats,
      unlockedFrames: unlockedFrames,
      joinDate: joinDate,
      totalCoinsEarned: totalCoinsEarned,
      gamesPlayed: gamesPlayed,
      victoryCount: victoryCount,
      favouriteGame: favouriteGame,
      achievements: achievements,
      ratKillsCount: ratKillsCount,
      wikiPagesRead: wikiPagesRead,
      activeTitle: activeTitle,
      unlockedTitles: unlockedTitles
    };

    if (existingIdx >= 0) {
      localDb[existingIdx].username = username;
      localDb[existingIdx].coins = coins;
      localDb[existingIdx].cosmetics = cosmetics;
      localDb[existingIdx].avatarCat = avatarCat;
      localDb[existingIdx].avatarExpression = avatarExpression;
      localDb[existingIdx].avatarFrame = avatarFrame;
      localDb[existingIdx].unlockedCats = unlockedCats;
      localDb[existingIdx].unlockedFrames = unlockedFrames;
      localDb[existingIdx].joinDate = joinDate;
      localDb[existingIdx].totalCoinsEarned = totalCoinsEarned;
      localDb[existingIdx].gamesPlayed = gamesPlayed;
      localDb[existingIdx].victoryCount = victoryCount;
      localDb[existingIdx].favouriteGame = favouriteGame;
      localDb[existingIdx].achievements = achievements;
      localDb[existingIdx].ratKillsCount = ratKillsCount;
      localDb[existingIdx].wikiPagesRead = wikiPagesRead;
      localDb[existingIdx].activeTitle = activeTitle;
      localDb[existingIdx].unlockedTitles = unlockedTitles;
    } else {
      localDb.push(profile);
    }
    localStorage.setItem('scw_local_profiles_database', JSON.stringify(localDb));
  }

  // Save current state to local storage
  function saveCoinsToLocalStorage() {
    try {
      localStorage.setItem('scw_coins_balance', userCoins.toString());
      localStorage.setItem('scw_owned_items', JSON.stringify(ownedItems));
      localStorage.setItem('scw_active_cosmetics', JSON.stringify(activeCosmetics));
      localStorage.setItem('scw_last_claim_timestamp', lastClaimTimestamp.toString());
      
      localStorage.setItem('scw_avatar_cat', avatarCat);
      localStorage.setItem('scw_avatar_expression', avatarExpression);
      localStorage.setItem('scw_avatar_frame', avatarFrame);
      localStorage.setItem('scw_unlocked_cats', JSON.stringify(unlockedCats));
      localStorage.setItem('scw_unlocked_frames', JSON.stringify(unlockedFrames));
      localStorage.setItem('scw_join_date', joinDate);
      localStorage.setItem('scw_total_coins_earned', totalCoinsEarned.toString());
      localStorage.setItem('scw_games_played', gamesPlayed.toString());
      localStorage.setItem('scw_victory_count', victoryCount.toString());
      localStorage.setItem('scw_favourite_game', favouriteGame);
      localStorage.setItem('scw_achievements', JSON.stringify(achievements));
      localStorage.setItem('scw_rat_kills_count', ratKillsCount.toString());
      localStorage.setItem('scw_wiki_pages_read', wikiPagesRead.toString());
      localStorage.setItem('scw_hours_played', hoursPlayed.toString());
      localStorage.setItem('scw_journal_streak', journalStreak.toString());
      localStorage.setItem('scw_login_streak', loginStreak.toString());
      localStorage.setItem('scw_coins_spent', coinsSpent.toString());
      localStorage.setItem('scw_active_title', activeTitle);
      localStorage.setItem('scw_unlocked_titles', JSON.stringify(unlockedTitles));
      localStorage.setItem('scw_bank_deposit_amount', bankDepositAmount.toString());
      localStorage.setItem('scw_bank_deposit_timestamp', bankDepositTimestamp.toString());
      localStorage.setItem('scw_user_xp', userXP.toString());
      localStorage.setItem('scw_user_level', userLevel.toString());
      localStorage.setItem('scw_user_prestige', userPrestige.toString());

      const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      if (localUser) {
        saveToLocalProfilesDatabase(localUser.displayName || "Local Fallback User", localUser.email, userCoins, ownedItems);
      }
    } catch (e) {
      console.error("Local storage error saving coins:", e);
    }
  }

  // Load from local storage
  function loadCoinsFromLocalStorage() {
    try {
      userCoins = parseInt(localStorage.getItem('scw_coins_balance') || '0', 10);
      ownedItems = JSON.parse(localStorage.getItem('scw_owned_items') || '[]');
      activeCosmetics = JSON.parse(localStorage.getItem('scw_active_cosmetics') || '[]');
      lastClaimTimestamp = parseInt(localStorage.getItem('scw_last_claim_timestamp') || '0', 10);
      
      avatarCat = localStorage.getItem('scw_avatar_cat') || 'cat_basic';
      avatarExpression = localStorage.getItem('scw_avatar_expression') || 'expr_happy';
      avatarFrame = localStorage.getItem('scw_avatar_frame') || 'frame_none';
      unlockedCats = JSON.parse(localStorage.getItem('scw_unlocked_cats') || '["cat_basic", "cat_orange", "cat_black", "cat_white", "cat_tuxedo", "cat_brown", "cat_calico", "cat_grey", "cat_siamese"]');
      unlockedFrames = JSON.parse(localStorage.getItem('scw_unlocked_frames') || '["frame_none"]');
      joinDate = localStorage.getItem('scw_join_date') || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
      if (isDeveloperEmail(localEmail)) {
        joinDate = "July 24, 2026";
      }
      totalCoinsEarned = parseInt(localStorage.getItem('scw_total_coins_earned') || '0', 10);
      gamesPlayed = parseInt(localStorage.getItem('scw_games_played') || '0', 10);
      victoryCount = parseInt(localStorage.getItem('scw_victory_count') || '0', 10);
      favouriteGame = localStorage.getItem('scw_favourite_game') || 'Super Smash Cats';
      achievements = JSON.parse(localStorage.getItem('scw_achievements') || '[]');
      ratKillsCount = parseInt(localStorage.getItem('scw_rat_kills_count') || '0', 10);
      wikiPagesRead = parseInt(localStorage.getItem('scw_wiki_pages_read') || '0', 10);
      hoursPlayed = parseFloat(localStorage.getItem('scw_hours_played') || '14.2');
      journalStreak = parseInt(localStorage.getItem('scw_journal_streak') || '3', 10);
      loginStreak = parseInt(localStorage.getItem('scw_login_streak') || '5', 10);
      coinsSpent = parseInt(localStorage.getItem('scw_coins_spent') || '0', 10);
      activeTitle = localStorage.getItem('scw_active_title') || '';
      unlockedTitles = JSON.parse(localStorage.getItem('scw_unlocked_titles') || '[]');
      bankDepositAmount = parseInt(localStorage.getItem('scw_bank_deposit_amount') || '0', 10);
      bankDepositTimestamp = parseInt(localStorage.getItem('scw_bank_deposit_timestamp') || '0', 10);
      userXP = parseInt(localStorage.getItem('scw_user_xp') || '0', 10);
      userLevel = parseInt(localStorage.getItem('scw_user_level') || '1', 10);
      userPrestige = parseInt(localStorage.getItem('scw_user_prestige') || '0', 10);
      
      updateCoinUI();
      applyActiveCosmetics();
      renderShopItems();
      updateChestUI();
      if (typeof updateBankUI === 'function') updateBankUI();
      if (typeof updateXPUI === 'function') updateXPUI();
    } catch (e) {
      console.error("Local storage loading error:", e);
    }
  }

  // Save / Sync to Firestore
  function syncCoinsToFirestore() {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
      const user = firebase.auth().currentUser;
      if (user) {
        const db = firebase.firestore();
        db.collection('users').doc(user.uid).set({
          coins: userCoins,
          ownedItems: ownedItems,
          activeCosmetics: activeCosmetics,
          lastClaimTimestamp: lastClaimTimestamp,
          avatarCat: avatarCat,
          avatarExpression: avatarExpression,
          avatarFrame: avatarFrame,
          unlockedCats: unlockedCats,
          unlockedFrames: unlockedFrames,
          joinDate: joinDate,
          totalCoinsEarned: totalCoinsEarned,
          gamesPlayed: gamesPlayed,
          victoryCount: victoryCount,
          favouriteGame: favouriteGame,
          achievements: achievements,
          ratKillsCount: ratKillsCount,
          wikiPagesRead: wikiPagesRead,
          hoursPlayed: hoursPlayed,
          journalStreak: journalStreak,
          loginStreak: loginStreak,
          coinsSpent: coinsSpent,
          activeTitle: activeTitle,
          unlockedTitles: unlockedTitles,
          userXP: userXP,
          userLevel: userLevel,
          userPrestige: userPrestige
        }, { merge: true }).catch(err => {
          console.warn("Firestore sync error:", err);
        });
      }
    }
  }

  // Update navbar/dashboard coin displays
  function updateCoinUI() {
    const headerBal = document.getElementById('header-coin-balance');
    const shopBal = document.getElementById('shop-coin-balance');
    const coinHeader = document.getElementById('coin-header-display');

    if (headerBal) headerBal.textContent = userCoins;
    if (shopBal) shopBal.textContent = userCoins;

    if (coinHeader) {
      coinHeader.style.transform = 'scale(1.15)';
      setTimeout(() => {
        coinHeader.style.transform = '';
      }, 200);
    }
  }

  // Add Coins
  function addCoins(amount, element) {
    userCoins += amount;
    totalCoinsEarned += amount;
    
    // Increment Shop Earn Quests
    incrementQuestProgress('shop_earn', amount);

    updateCoinUI();
    playRetroSound('coin');
    if (element) {
      showFloatingCoins(amount, element);
    }
    saveCoinsToLocalStorage();
    syncCoinsToFirestore();
    checkAchievements();
    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    if (savedUser) renderProfileCustoms(savedUser);
  }

  // Deduct Coins
  function deductCoins(amount) {
    if (userCoins >= amount) {
      userCoins -= amount;
      coinsSpent += amount; // Track coins spent
      
      // Increment Shop Spend Quests
      incrementQuestProgress('shop_spend', amount);

      updateCoinUI();
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      return true;
    }
    return false;
  }

  // Apply purchased active cosmetics
  function applyActiveCosmetics() {
    const navLabel = document.getElementById('account-nav-label');
    const profileName = document.getElementById('profile-display-name');
    const profileAvatar = document.querySelector('.profile-avatar');
    const shopPreviewName = document.getElementById('preview-gold-name');
    const shopPreviewAvatar = document.getElementById('preview-avatar-circle');

    // 1. Golden Name Glow
    const isGoldName = activeCosmetics.includes('golden-name');
    [navLabel, profileName, shopPreviewName].forEach(el => {
      if (el) {
        if (isGoldName) {
          el.classList.add('gold-glow-active');
        } else {
          el.classList.remove('gold-glow-active');
        }
      }
    });

    // 2. Neon Purple Border
    const isPurpleBorder = activeCosmetics.includes('purple-border');
    [profileAvatar, shopPreviewAvatar].forEach(el => {
      if (el) {
        if (isPurpleBorder) {
          el.classList.add('purple-border-active');
        } else {
          el.classList.remove('purple-border-active');
        }
      }
    });

    // 3. Crown Badge
    const isCrownBadge = activeCosmetics.includes('crown-badge');
    [navLabel, profileName].forEach(el => {
      if (el) {
        if (isCrownBadge) {
          el.classList.add('crown-badge-active');
        } else {
          el.classList.remove('crown-badge-active');
        }
      }
    });
  }

  // ===== DAILY QUESTS SYSTEM =====
  function initializeQuests() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('scw_quests_date');
    const savedQuests = localStorage.getItem('scw_active_quests');

    if (savedDate === today && savedQuests) {
      updateQuestsUI();
      return;
    }

    // Generate new quests for today & award daily login XP (+25 XP)
    if (typeof addXP === 'function') addXP(25);
    const standards = QUESTS_DATABASE.filter(q => !q.isRare);
    const rares = QUESTS_DATABASE.filter(q => q.isRare);

    // Pick 3 unique standard quests
    const shuffledStandards = standards.sort(() => 0.5 - Math.random());
    const pickedQuests = shuffledStandards.slice(0, 3).map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false
    }));

    // Pick 1 rare quest (30% chance) or another standard quest
    let fourthQuest;
    if (Math.random() < 0.30) {
      const rare = rares[Math.floor(Math.random() * rares.length)];
      fourthQuest = { ...rare, progress: 0, completed: false, claimed: false };
    } else {
      // Find a standard quest not already picked
      const remainingStandards = shuffledStandards.slice(3);
      fourthQuest = { ...remainingStandards[0], progress: 0, completed: false, claimed: false };
    }
    pickedQuests.push(fourthQuest);

    localStorage.setItem('scw_quests_date', today);
    localStorage.setItem('scw_active_quests', JSON.stringify(pickedQuests));

    // Reset visit counts for hub_visit_games
    localStorage.removeItem('scw_visited_game_pages');

    updateQuestsUI();
  }

  window.initializeQuests = initializeQuests; // Make globally accessible
  window.updateQuestsUI = updateQuestsUI;

  function updateQuestsUI() {
    const container = document.getElementById('quests-container');
    if (!container) return;

    const activeQuests = JSON.parse(localStorage.getItem('scw_active_quests') || '[]');
    container.innerHTML = '';

    if (activeQuests.length === 0) {
      container.innerHTML = '<p style="font-size: 0.85rem; color: var(--color-text-muted);">No active quests. Check back tomorrow!</p>';
      return;
    }

    activeQuests.forEach(q => {
      const isFinished = q.progress >= q.target;
      const isClaimed = q.claimed;

      const questItem = document.createElement('div');
      questItem.style.display = 'flex';
      questItem.style.alignItems = 'center';
      questItem.style.justifyContent = 'space-between';
      questItem.style.padding = '12px';
      questItem.style.background = q.isRare ? 'rgba(234, 179, 8, 0.04)' : 'rgba(255, 255, 255, 0.01)';
      questItem.style.border = q.isRare 
        ? '1px dashed rgba(234, 179, 8, 0.3)' 
        : '1px solid var(--border-light)';
      questItem.style.borderRadius = '10px';
      questItem.style.transition = 'var(--transition-smooth)';
      
      if (isFinished && !isClaimed) {
        questItem.style.borderColor = q.isRare ? '#eab308' : 'var(--color-success)';
      }

      // Checkbox / State Icon
      let iconHtml = `<span style="font-size: 1.1rem; margin-right: 10px; color: var(--color-text-muted);">⏳</span>`;
      if (isClaimed) {
        iconHtml = `<span style="font-size: 1.1rem; margin-right: 10px; color: var(--color-success);">✔</span>`;
      } else if (isFinished) {
        iconHtml = `<span style="font-size: 1.1rem; margin-right: 10px; color: var(--color-accent); cursor: pointer;" title="Collect reward!">🎁</span>`;
      }

      // Quest detail layout
      const details = document.createElement('div');
      details.style.display = 'flex';
      details.style.alignItems = 'center';
      details.style.flex = '1';

      const textWrapper = document.createElement('div');
      textWrapper.style.display = 'flex';
      textWrapper.style.flexDirection = 'column';

      const titleSpan = document.createElement('span');
      titleSpan.style.fontSize = '0.9rem';
      titleSpan.style.fontWeight = '600';
      titleSpan.style.color = q.isRare ? '#fef08a' : 'var(--color-text-primary)';
      if (isClaimed) {
        titleSpan.style.textDecoration = 'line-through';
        titleSpan.style.color = 'var(--color-text-muted)';
      }
      titleSpan.innerHTML = (q.isRare ? '💎 ' : '') + q.text;

      const progressSpan = document.createElement('span');
      progressSpan.style.fontSize = '0.75rem';
      progressSpan.style.color = 'var(--color-text-muted)';
      progressSpan.style.marginTop = '2px';
      progressSpan.textContent = `Progress: ${q.progress}/${q.target}`;

      textWrapper.appendChild(titleSpan);
      textWrapper.appendChild(progressSpan);

      details.innerHTML = iconHtml;
      details.appendChild(textWrapper);

      // Reward block or Claim button
      const actionBlock = document.createElement('div');
      actionBlock.style.marginLeft = '10px';

      if (isClaimed) {
        actionBlock.innerHTML = `<span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase;">Claimed</span>`;
      } else if (isFinished) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'btn btn-primary btn-sm';
        claimBtn.style.padding = '4px 10px';
        claimBtn.style.fontSize = '0.75rem';
        claimBtn.style.fontWeight = '700';
        claimBtn.style.background = q.isRare ? 'linear-gradient(135deg, #eab308, #ca8a04)' : 'var(--color-accent)';
        claimBtn.style.borderColor = q.isRare ? '#fbbf24' : 'var(--color-accent)';
        claimBtn.textContent = 'CLAIM';
        claimBtn.addEventListener('click', (e) => claimQuestReward(q.id, claimBtn));
        actionBlock.appendChild(claimBtn);
      } else {
        const rewardSpan = document.createElement('span');
        rewardSpan.style.fontSize = '0.85rem';
        rewardSpan.style.fontWeight = '800';
        rewardSpan.style.color = q.isRare ? '#ffd700' : 'var(--color-text-primary)';
        rewardSpan.textContent = `+${q.reward} 🪙`;
        actionBlock.appendChild(rewardSpan);
      }

      questItem.appendChild(details);
      questItem.appendChild(actionBlock);
      container.appendChild(questItem);
    });

    // Add developer reroll option if developer session is active
    const isAuth = sessionStorage.getItem('dev_auth') === 'true';
    if (isAuth) {
      const devRerollBox = document.createElement('div');
      devRerollBox.style.marginTop = '15px';
      devRerollBox.style.borderTop = '1px dashed rgba(255, 255, 255, 0.15)';
      devRerollBox.style.paddingTop = '15px';
      devRerollBox.style.display = 'flex';
      devRerollBox.style.justifyContent = 'center';
      devRerollBox.style.width = '100%';
      
      const devRerollBtn = document.createElement('button');
      devRerollBtn.className = 'btn btn-secondary btn-sm';
      devRerollBtn.style.background = 'rgba(239, 68, 68, 0.12)';
      devRerollBtn.style.borderColor = 'rgba(239, 68, 68, 0.25)';
      devRerollBtn.style.color = '#f87171';
      devRerollBtn.style.fontWeight = '700';
      devRerollBtn.style.width = '100%';
      devRerollBtn.textContent = "⚠️ Dev: Reroll Today's Quests";
      
      devRerollBtn.addEventListener('click', () => {
        if (confirm("⚡ Developer Actions: Reroll all active daily quests? This will reset your progress for today's quests.")) {
          localStorage.removeItem('scw_quests_date');
          localStorage.removeItem('scw_active_quests');
          playRetroSound('click');
          initializeQuests();
          alert("⚡ Today's active quests successfully re-rolled and updated!");
        }
      });
      
      devRerollBox.appendChild(devRerollBtn);
      container.appendChild(devRerollBox);
    }
  }

  window.updateQuestsUI = updateQuestsUI;

  function claimQuestReward(questId, btnElement) {
    const activeQuests = JSON.parse(localStorage.getItem('scw_active_quests') || '[]');
    const quest = activeQuests.find(q => q.id === questId);

    if (quest && !quest.claimed && quest.progress >= quest.target) {
      quest.claimed = true;
      localStorage.setItem('scw_active_quests', JSON.stringify(activeQuests));

      playRetroSound('purchase');
      addCoins(quest.reward, btnElement);
      if (typeof addXP === 'function') addXP(30);

      // Track shop earn quest progress
      incrementQuestProgress('shop_earn', quest.reward);

      // Check if player has completed all daily quests today (rare quest target)
      const allCompletedToday = activeQuests.every(q => q.progress >= q.target);
      if (allCompletedToday) {
        incrementQuestProgress('hub_quests_all');
      }

      updateQuestsUI();
      alert(`🎉 Claimed quest reward! Received ${quest.reward} Catnip Coins.`);
    }
  }

  function incrementQuestProgress(type, amount = 1, questId = null) {
    try {
      const activeQuests = JSON.parse(localStorage.getItem('scw_active_quests') || '[]');
      let changed = false;

      for (const q of activeQuests) {
        if (q.type === type && (!questId || q.id === questId) && !q.claimed) {
          const oldProgress = q.progress;
          q.progress = Math.min(q.target, q.progress + amount);
          
          if (q.progress >= q.target && oldProgress < q.target) {
            playRetroSound('click');
            // If they just completed this quest, check if all dailies are now completed
            const allCompletedToday = activeQuests.every(oq => oq.progress >= oq.target);
            if (allCompletedToday) {
              // Defer briefly to allow this quest to finish saving
              setTimeout(() => incrementQuestProgress('hub_quests_all'), 100);
            }
          }
          changed = true;
        }
      }

      if (changed) {
        localStorage.setItem('scw_active_quests', JSON.stringify(activeQuests));
        updateQuestsUI();
      }
    } catch (e) {
      console.warn("Failed to increment quest progress:", e);
    }
  }

  window.incrementQuestProgress = incrementQuestProgress;

  // Render Shop Items state
  function renderShopItems() {
    const itemCards = document.querySelectorAll('.shop-item-card');
    itemCards.forEach(card => {
      const itemId = card.getAttribute('data-item-id');
      const buyBtn = card.querySelector('.btn-buy-item');
      if (!buyBtn) return;

      const isOwned = ownedItems.includes(itemId);
      const isActive = activeCosmetics.includes(itemId);

      if (isOwned) {
        if (isActive) {
          buyBtn.textContent = 'Active / Equipped';
          buyBtn.className = 'btn btn-secondary btn-sm btn-buy-item owned-active';
        } else {
          buyBtn.textContent = 'Equip Item';
          buyBtn.className = 'btn btn-secondary btn-sm btn-buy-item owned-equip';
        }
      } else {
        const cost = buyBtn.getAttribute('data-cost');
        buyBtn.textContent = `Unlock (Cost: ${cost} 🪙)`;
        buyBtn.className = 'btn btn-secondary btn-sm btn-buy-item';
      }
    });
  }

  // Handle Item Shop Clicks
  function handleShopItemInteraction(itemId, cost, element) {
    const isOwned = ownedItems.includes(itemId);
    const isActive = activeCosmetics.includes(itemId);

    if (isOwned) {
      // Toggle equip state
      playRetroSound('click');
      if (isActive) {
        activeCosmetics = activeCosmetics.filter(item => item !== itemId);
      } else {
        activeCosmetics.push(itemId);
        // Increment customization quest
        incrementQuestProgress('hub_customise');
      }
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      applyActiveCosmetics();
      renderShopItems();
    } else {
      // Attempt to buy
      if (userCoins >= cost) {
        if (deductCoins(cost)) {
          ownedItems.push(itemId);
          activeCosmetics.push(itemId); // Auto-equip on purchase
          playRetroSound('purchase');
          if (typeof addXP === 'function') addXP(25);
          
          // Increment quests
          incrementQuestProgress('shop_buy');
          incrementQuestProgress('hub_customise');

          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
          applyActiveCosmetics();
          renderShopItems();
          alert(`🎉 Congratulations! You have successfully unlocked the ${itemId.replace('-', ' ')} item!`);
        }
      } else {
        alert("❌ Insufficient Catnip Coins! Explore the wiki or complete your daily quests to get more coins.");
      }
    }
  }
  function openMysteryChest(element) {
    const cost = 100;
    if (userCoins < cost) {
      alert("❌ Insufficient Catnip Coins to open the Mystery Gachapon Chest!");
      return;
    }

    if (deductCoins(cost)) {
      playRetroSound('purchase');
      
      // Animate chest emoji
      const chestVisual = document.getElementById('mystery-chest-visual');
      if (chestVisual) {
        chestVisual.style.transform = 'scale(1.4) rotate(15deg)';
        setTimeout(() => { chestVisual.style.transform = ''; }, 400);
      }

      // Quest Increments
      incrementQuestProgress('shop_chest');
      incrementQuestProgress('shop_chest_rare');

      // Luck boost calculation: if signed-nametag is equipped, low chance tiers get a +25% relative boost
      const hasLuckBoost = activeCosmetics.includes('signed-nametag');
      const forcedOverride = localStorage.getItem('scw_dev_crate_override') || 'random';
      
      // Load custom developer rates if configured, otherwise fallback to defaults
      let commonRate = parseFloat(localStorage.getItem('scw_crate_rate_common') || (hasLuckBoost ? '50' : '60')) / 100;
      let rareRate = parseFloat(localStorage.getItem('scw_crate_rate_rare') || (hasLuckBoost ? '25' : '20')) / 100;
      let epicRate = parseFloat(localStorage.getItem('scw_crate_rate_epic') || (hasLuckBoost ? '15' : '12')) / 100;
      let legendaryRate = parseFloat(localStorage.getItem('scw_crate_rate_legendary') || (hasLuckBoost ? '7.5' : '6')) / 100;
      
      let commonLimit = commonRate;
      let rareLimit = commonLimit + rareRate;
      let epicLimit = rareLimit + epicRate;
      let legendaryLimit = epicLimit + legendaryRate;

      const roll = Math.random();
      let forceTier = '';
      if (forcedOverride !== 'random') {
        forceTier = forcedOverride;
        localStorage.setItem('scw_dev_crate_override', 'random');
        const overrideSelect = document.getElementById('dev-crate-override');
        if (overrideSelect) overrideSelect.value = 'random';
      }

      let feedback = '';

      const isCommon = (forceTier === 'common_coins') || (forceTier === '' && roll < commonLimit);
      const isRare = (forceTier === 'rare_border') || (forceTier === '' && !isCommon && roll < rareLimit);
      const isEpic = (forceTier === 'epic_glow' || forceTier === 'epic_coins') || (forceTier === '' && !isCommon && !isRare && roll < epicLimit);
      const isLegendary = (forceTier === 'legendary_anim' || forceTier === 'legendary_rainbow' || forceTier === 'legendary_title') || (forceTier === '' && !isCommon && !isRare && !isEpic && roll < legendaryLimit);
      const isUltra = (forceTier !== '' && !isCommon && !isRare && !isEpic && !isLegendary) || (forceTier === '' && !isCommon && !isRare && !isEpic && !isLegendary);

      if (isCommon) {
        // Common Tier (Coins stash)
        const subRoll = Math.random();
        let prize = 5;
        if (subRoll < 0.45) prize = 5;
        else if (subRoll < 0.70) prize = 50;
        else if (subRoll < 0.85) prize = 100;
        else if (subRoll < 0.95) prize = 250;
        else prize = 500;

        addCoins(prize, element);
        feedback = `📦 [COMMON REWARD] The chest opened to reveal a coin stash! You received ${prize} Catnip Coins.`;
      } 
      else if (isRare) {
        // Rare Tier (Borders/Frames)
        const borderIds = ['frame_neon_purple', 'frame_electric_blue', 'frame_emerald', 'frame_gold', 'frame_ruby'];
        const unownedBorders = borderIds.filter(id => !ownedItems.includes(id));
        if (unownedBorders.length > 0) {
          const wonId = unownedBorders[Math.floor(Math.random() * unownedBorders.length)];
          ownedItems.push(wonId);
          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
          renderShopItems();
          feedback = `🎨 [RARE REWARD] You unlocked a colorful profile border frame: ${wonId.replace('frame_', '').replace('_', ' ').toUpperCase()}!`;
        } else {
          const refund = 120;
          addCoins(refund, element);
          feedback = `🎨 [RARE REWARD] You rolled a border frame you already own, so you were refunded ${refund} Catnip Coins!`;
        }
      } 
      else if (isEpic) {
        // Epic Tier (Golden Name or 200 coins)
        const isGlow = (forceTier === 'epic_glow') || (forceTier === '' && Math.random() < 0.70);
        if (isGlow) {
          if (!ownedItems.includes('golden-name')) {
            ownedItems.push('golden-name');
            activeCosmetics.push('golden-name');
            applyActiveCosmetics();
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            renderShopItems();
            feedback = `🌟 [EPIC REWARD] UNLOCKED: Golden Name Glow! Your profile name now glows gold!`;
          } else {
            const refund = 150;
            addCoins(refund, element);
            feedback = `🌟 [EPIC REWARD] You rolled Golden Name which you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else {
          addCoins(200, element);
          feedback = `🌟 [EPIC REWARD] You rolled a premium coin cache! Received 200 Catnip Coins.`;
        }
      } 
      else if (isLegendary) {
        // Legendary Tier (Animated Border, Rainbow Name, or Exclusive Title)
        let choice = 'anim';
        if (forceTier === 'legendary_anim') choice = 'anim';
        else if (forceTier === 'legendary_rainbow') choice = 'rainbow';
        else if (forceTier === 'legendary_title') choice = 'title';
        else {
          const subRoll = Math.random();
          if (subRoll < 0.50) choice = 'anim';
          else if (subRoll < 0.90) choice = 'rainbow';
          else choice = 'title';
        }

        if (choice === 'anim') {
          const animBorders = ['frame_rainbow', 'frame_electric_sparks', 'frame_snowflakes', 'frame_flames', 'frame_floating_stars'];
          const unowned = animBorders.filter(id => !ownedItems.includes(id));
          if (unowned.length > 0) {
            const wonId = unowned[Math.floor(Math.random() * unowned.length)];
            ownedItems.push(wonId);
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            renderShopItems();
            feedback = `🎆 [LEGENDARY REWARD] UNLOCKED: Animated Border Frame (${wonId.replace('frame_', '').replace('_', ' ').toUpperCase()})!`;
          } else {
            const refund = 250;
            addCoins(refund, element);
            feedback = `🎆 [LEGENDARY REWARD] You rolled an animated border you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else if (choice === 'rainbow') {
          if (!ownedItems.includes('rainbow-name')) {
            ownedItems.push('rainbow-name');
            activeCosmetics.push('rainbow-name');
            applyActiveCosmetics();
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            renderShopItems();
            feedback = `🌈 [LEGENDARY REWARD] UNLOCKED: Animated Rainbow Name! Your profile name now shifts hues!`;
          } else {
            const refund = 250;
            addCoins(refund, element);
            feedback = `🌈 [LEGENDARY REWARD] You rolled Rainbow Name which you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else {
          const titles = ["Legendary Feline 👑", "Mythic Champion ⚔️", "Gacha Legend 🎰", "Lucky Cat 🍀", "Chest Raider 💎", "Catnip Baron 👑", "Antigravity Master 🌌"];
          const unowned = titles.filter(t => !unlockedTitles.includes(t));
          if (unowned.length > 0) {
            const title = unowned[Math.floor(Math.random() * unowned.length)];
            unlockedTitles.push(title);
            activeTitle = title;
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
            if (savedUser) renderProfileCustoms(savedUser);
            feedback = `👑 [LEGENDARY REWARD] UNLOCKED Title: "${title}"!`;
          } else {
            const refund = 200;
            addCoins(refund, element);
            feedback = `👑 [LEGENDARY REWARD] You rolled a title you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        }
      } 
      else {
        // Ultra Rare Tier (Developer Signed Cosmetics)
        let choice = 'tag';
        if (forceTier === 'ultra_signed_tag') choice = 'tag';
        else if (forceTier === 'ultra_dev_border') choice = 'border';
        else if (forceTier === 'ultra_dev_cat') choice = 'cat';
        else if (forceTier === 'ultra_signed_badge') choice = 'badge';
        else if (forceTier === 'jackpot_1000') choice = 'jackpot';
        else {
          const subRoll = Math.random();
          if (subRoll < 0.25) choice = 'tag';
          else if (subRoll < 0.50) choice = 'border';
          else if (subRoll < 0.75) choice = 'cat';
          else if (subRoll < 0.97) choice = 'badge';
          else choice = 'jackpot';
        }

        if (choice === 'tag') {
          if (!ownedItems.includes('signed-nametag')) {
            ownedItems.push('signed-nametag');
            activeCosmetics.push('signed-nametag');
            applyActiveCosmetics();
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            feedback = `✍ [ULTRA RARE] DEVELOPER SIGNED: Signed Name Tag! Prepends 👑 and appends 's luck (+25% luck roll rate when equipped!).`;
          } else {
            const refund = 300;
            addCoins(refund, element);
            feedback = `✍ [ULTRA RARE] You rolled Signed Name Tag which you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else if (choice === 'border') {
          if (!ownedItems.includes('frame_developer')) {
            ownedItems.push('frame_developer');
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            feedback = `🛠️ [ULTRA RARE] DEVELOPER COSMETIC: Developer Border frame unlocked! Glowing violet stars and tiny cat paws!`;
          } else {
            const refund = 300;
            addCoins(refund, element);
            feedback = `🛠️ [ULTRA RARE] You rolled Developer Border frame which you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else if (choice === 'cat') {
          if (!ownedItems.includes('cat_developer')) {
            ownedItems.push('cat_developer');
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            feedback = `🧑‍💻 [ULTRA RARE] DEVELOPER COSMETIC: Developer Cat avatar unlocked! Wears a developer wrench!`;
          } else {
            const refund = 300;
            addCoins(refund, element);
            feedback = `🧑‍💻 [ULTRA RARE] You rolled Developer Cat avatar which you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else if (choice === 'badge') {
          const badges = ['badge_dev_signed', 'badge_dev_star', 'badge_dev_paw', 'badge_dev_pick'];
          const unowned = badges.filter(b => !ownedItems.includes(b));
          if (unowned.length > 0) {
            const badge = unowned[Math.floor(Math.random() * unowned.length)];
            ownedItems.push(badge);
            activeCosmetics.push(badge);
            applyActiveCosmetics();
            saveCoinsToLocalStorage();
            syncCoinsToFirestore();
            feedback = `💜 [ULTRA RARE] DEVELOPER SIGNED BADGE: Unlocked and equipped!`;
          } else {
            const refund = 250;
            addCoins(refund, element);
            feedback = `💜 [ULTRA RARE] You rolled a developer signed badge you already own, so you were refunded ${refund} Catnip Coins!`;
          }
        } else {
          const jackpotPrize = (choice === 'jackpot') ? 1000 : 500;
          addCoins(jackpotPrize, element);
          feedback = `🎰 [ULTRA RARE JACKPOT] ${jackpotPrize} CATNIP COINS JACKPOT!!! The chest exploded with glittering gold coins!`;
        }
      }

      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      alert(feedback);
    }
  }

  // Hook mystery chest button click listener
  const btnOpenChest = document.getElementById('btn-open-mystery-chest');
  if (btnOpenChest) {
    btnOpenChest.addEventListener('click', () => openMysteryChest(btnOpenChest));
  }

  // ==================== CATNIP SAVINGS BANK SYSTEM ====================
  function updateBankUI() {
    const activeDepositInfo = document.getElementById('bank-active-deposit-info');
    const depositForm = document.getElementById('bank-deposit-form');
    const withdrawForm = document.getElementById('bank-withdraw-form');
    const walletBalanceDisplay = document.getElementById('bank-wallet-balance-display');
    
    if (walletBalanceDisplay) {
      walletBalanceDisplay.textContent = userCoins.toLocaleString();
    }
    
    if (bankDepositAmount > 0) {
      if (activeDepositInfo) activeDepositInfo.style.display = 'block';
      if (depositForm) depositForm.style.display = 'none';
      if (withdrawForm) withdrawForm.style.display = 'block';
      
      const depositAmountDisplay = document.getElementById('bank-deposit-amount-display');
      const depositMaturedDisplay = document.getElementById('bank-deposit-matured-display');
      const depositDateDisplay = document.getElementById('bank-deposit-date-display');
      
      const maturedAmount = Math.floor(bankDepositAmount * 1.25);
      
      if (depositAmountDisplay) depositAmountDisplay.textContent = `${bankDepositAmount.toLocaleString()} Coins`;
      if (depositMaturedDisplay) depositMaturedDisplay.textContent = `${maturedAmount.toLocaleString()} Coins`;
      
      const lockDuration = 7 * 24 * 60 * 60 * 1000;
      const maturityTime = bankDepositTimestamp + lockDuration;
      const maturityDate = new Date(maturityTime);
      
      if (depositDateDisplay) {
        depositDateDisplay.textContent = maturityDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      const devFFContainer = document.getElementById('bank-dev-fastforward');
      if (devFFContainer) {
        const isAuth = sessionStorage.getItem('dev_auth') === 'true';
        devFFContainer.style.display = isAuth ? 'block' : 'none';
      }
      
      tickBankTimer();
    } else {
      if (activeDepositInfo) activeDepositInfo.style.display = 'none';
      if (depositForm) depositForm.style.display = 'block';
      if (withdrawForm) withdrawForm.style.display = 'none';
      
      const depositInput = document.getElementById('bank-deposit-input');
      if (depositInput) depositInput.value = '';
    }
  }

  window.updateBankUI = updateBankUI;

  function tickBankTimer() {
    if (bankDepositAmount <= 0) return;
    
    const timerDisplay = document.getElementById('bank-deposit-timer-display');
    const withdrawBtn = document.getElementById('btn-bank-withdraw');
    
    const lockDuration = 7 * 24 * 60 * 60 * 1000;
    const maturityTime = bankDepositTimestamp + lockDuration;
    const now = Date.now();
    const remainingTime = maturityTime - now;
    
    if (remainingTime <= 0) {
      if (timerDisplay) {
        timerDisplay.textContent = "MATURED / READY";
        timerDisplay.style.color = "#00E676";
      }
      if (withdrawBtn) {
        withdrawBtn.removeAttribute('disabled');
        withdrawBtn.textContent = "Claim Matured Coins";
      }
    } else {
      const totalSecs = Math.floor(remainingTime / 1000);
      const days = Math.floor(totalSecs / (24 * 3600));
      const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      
      let timerStr = '';
      if (days > 0) timerStr += `${days}d `;
      timerStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      if (timerDisplay) {
        timerDisplay.textContent = timerStr;
        timerDisplay.style.color = "var(--color-accent)";
      }
      if (withdrawBtn) {
        withdrawBtn.setAttribute('disabled', 'true');
        withdrawBtn.textContent = "Locked in Savings Vault";
      }
    }
  }

  // Bind Bank Deposit Buttons
  const btnBankDeposit = document.getElementById('btn-bank-deposit');
  const btnBankDepositMax = document.getElementById('btn-bank-deposit-max');
  const btnBankWithdraw = document.getElementById('btn-bank-withdraw');
  const btnBankDevFF = document.getElementById('btn-bank-dev-ff');
  const bankDepositInput = document.getElementById('bank-deposit-input');

  if (btnBankDepositMax && bankDepositInput) {
    btnBankDepositMax.addEventListener('click', () => {
      bankDepositInput.value = userCoins;
      playRetroSound('click');
    });
  }

  if (btnBankDeposit && bankDepositInput) {
    btnBankDeposit.addEventListener('click', () => {
      const amount = parseInt(bankDepositInput.value, 10);
      if (isNaN(amount) || amount < 10) {
        alert("❌ Error: Minimum deposit is 10 Catnip Coins!");
        return;
      }
      if (amount > userCoins) {
        alert("❌ Error: You do not have enough coins in your wallet!");
        return;
      }
      
      userCoins -= amount;
      bankDepositAmount = amount;
      bankDepositTimestamp = Date.now();
      
      updateCoinUI();
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      
      playRetroSound('purchase');
      updateBankUI();
      alert(`🏦 Success: Deposited ${amount.toLocaleString()} Coins into the Savings Bank! Return in 7 days to claim your matured yield.`);
    });
  }

  if (btnBankWithdraw) {
    btnBankWithdraw.addEventListener('click', () => {
      const lockDuration = 7 * 24 * 60 * 60 * 1000;
      const maturityTime = bankDepositTimestamp + lockDuration;
      if (Date.now() < maturityTime) {
        alert("❌ Error: Your deposit has not matured yet!");
        return;
      }
      
      const interestEarned = Math.floor(bankDepositAmount * 0.25);
      const totalReturn = bankDepositAmount + interestEarned;
      
      userCoins += totalReturn;
      totalCoinsEarned += interestEarned;
      
      bankDepositAmount = 0;
      bankDepositTimestamp = 0;
      
      updateCoinUI();
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      
      playRetroSound('victory');
      updateBankUI();
      alert(`🎉 Congratulations! You successfully claimed your deposit of ${totalReturn.toLocaleString()} Coins (including a +${interestEarned.toLocaleString()} Coins saving yield bonus)!`);
    });
  }

  if (btnBankDevFF) {
    btnBankDevFF.addEventListener('click', () => {
      bankDepositTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000);
      tickBankTimer();
      playRetroSound('click');
      alert("⚡ Dev: Bank timelock matured successfully!");
    });
  }

  setInterval(tickBankTimer, 1000);

  // Listen to cross-tab storage changes (e.g., from Super Smash Cats)
  window.addEventListener('storage', (e) => {
    if (e.key === 'scw_active_quests') {
      updateQuestsUI();
    }
    if (e.key === 'scw_local_coins') {
      try {
        const val = parseInt(localStorage.getItem('scw_local_coins') || '0', 10);
        if (val !== userCoins) {
          userCoins = val;
          updateCoinUI();
        }
      } catch(err) {}
    }
  });

  // Initialize Daily Quests
  initializeQuests();

  // Attach Item shop buy button click listeners
  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.btn-buy-item');
    if (buyBtn) {
      const itemId = buyBtn.getAttribute('data-item-id');
      const cost = parseInt(buyBtn.getAttribute('data-cost') || '0', 10);
      handleShopItemInteraction(itemId, cost, buyBtn);
    }
  });

  let particleInterval = null;
  function startFallingEffects(event) {
    if (particleInterval) clearInterval(particleInterval);
    const oldContainer = document.querySelector('.falling-particle-container');
    if (oldContainer) oldContainer.remove();

    if (event === 'none') return;

    const container = document.createElement('div');
    container.className = 'falling-particle-container';
    document.body.appendChild(container);

    let emojis = [];
    if (event === 'halloween') emojis = ['🦇', '🎃', '🍂', '👻'];
    else if (event === 'winter') emojis = ['❄️', '☃️', '🔔', '✨'];
    else if (event === 'spring') emojis = ['🌸', '🍃', '🌷', '🦋'];
    else if (event === 'anniversary') emojis = ['🎉', '🎈', '✨', '🎈'];

    particleInterval = setInterval(() => {
      if (document.hidden) return;
      const p = document.createElement('div');
      p.className = 'falling-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left = Math.random() * 100 + 'vw';
      
      const duration = 5 + Math.random() * 5;
      p.style.animationDuration = duration + 's';
      p.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
      
      container.appendChild(p);
      setTimeout(() => p.remove(), duration * 1000);
    }, 400);
  }

  function updateActiveEvent() {
    let selectedSetting = overrideEventSetting;
    if (selectedSetting === 'auto') {
      const now = new Date();
      const month = now.getMonth(); // 0-11
      const date = now.getDate(); // 1-31

      // Halloween: Oct 1 - Nov 5
      if (month === 9 || (month === 10 && date <= 5)) {
        selectedSetting = 'halloween';
      }
      // Winter: Dec 1 - Jan 15
      else if (month === 11 || (month === 0 && date <= 15)) {
        selectedSetting = 'winter';
      }
      // Spring: Mar 20 - Apr 30
      else if ((month === 2 && date >= 20) || month === 3) {
        selectedSetting = 'spring';
      }
      // Anniversary: July 15 - July 25
      else if (month === 6 && date >= 15 && date <= 25) {
        selectedSetting = 'anniversary';
      }
      else {
        selectedSetting = 'none';
      }
    }

    activeEvent = selectedSetting;

    // Apply Active Event CSS Classes to document.body
    document.body.classList.remove('theme-halloween', 'theme-winter', 'theme-spring', 'theme-anniversary');
    if (activeEvent !== 'none') {
      document.body.classList.add(`theme-${activeEvent}`);
    }

    // Update Header Banner
    const banner = document.getElementById('event-header-banner');
    if (banner) {
      if (activeEvent === 'none') {
        banner.style.display = 'none';
      } else {
        banner.style.display = 'inline-flex';
        const icon = banner.querySelector('.event-icon');
        const name = banner.querySelector('.event-name');
        
        let labelName = 'Event';
        let labelIcon = '🐾';
        
        if (activeEvent === 'halloween') { labelName = 'Halloween Event'; labelIcon = '🎃'; }
        else if (activeEvent === 'winter') { labelName = 'Winter Event'; labelIcon = '🎄'; }
        else if (activeEvent === 'spring') { labelName = 'Spring Event'; labelIcon = '🐣'; }
        else if (activeEvent === 'anniversary') { labelName = 'Anniversary Event'; labelIcon = '🎆'; }
        
        if (icon) icon.textContent = labelIcon;
        if (name) name.textContent = labelName;
      }
    }

    // Toggle Seasonal Shop Items Visibility
    document.querySelectorAll('.seasonal-item').forEach(item => {
      const itemEv = item.getAttribute('data-event');
      if (itemEv === activeEvent) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });

    // Start Particles
    startFallingEffects(activeEvent);

    // Evaluate Achievements
    if (typeof checkAchievements === 'function') {
      checkAchievements();
    }
  }

  function updateChestUI() {
    if (typeof updateQuestsUI === 'function') {
      updateQuestsUI();
    }
  }

  // Track Daily Chest Cooldown periodically
  setInterval(updateChestUI, 30000); // refresh chest timer every 30s

  // Initial load
  loadCoinsFromLocalStorage();

  // Initialize Active Seasonal Event
  updateActiveEvent();

  // Bind override selector event listener
  const devEventSelect = document.getElementById('dev-event-override');
  if (devEventSelect) {
    const savedOverride = localStorage.getItem('scw_event_override') || 'auto';
    devEventSelect.value = savedOverride;
    overrideEventSetting = savedOverride;
    updateActiveEvent();
    
    devEventSelect.addEventListener('change', () => {
      const val = devEventSelect.value;
      localStorage.setItem('scw_event_override', val);
      overrideEventSetting = val;
      updateActiveEvent();
    });
  }

  // Initialize and bind Game Bug Code Cheats selectors
  function updateSCWSpecsPanel() {
    const savedCode = localStorage.getItem('scw_bug_code_scw') || '0';
    const codenameEl = document.querySelector('.scw-secrets .secrets-meta-item:nth-child(1) .val');
    const statusEl = document.querySelector('.scw-secrets .secrets-meta-item:nth-child(4) .val');
    if (!codenameEl || !statusEl) return;
    
    statusEl.className = 'val status-pill';
    let codenameText = 'Project Anti-Catite';
    let statusText = 'Active / 0 Bugs';
    
    switch (savedCode) {
      case '0':
        codenameText += ' (0 Bugs / Resolved)';
        statusText = 'Active / 0 Bugs';
        statusEl.classList.add('green-pill');
        statusEl.style.cssText = '';
        codenameEl.className = 'val accent-green';
        break;
      case '1':
        codenameText += ' (Code 1 / Buggy)';
        statusText = 'Buggy / Code 1';
        statusEl.style.cssText = 'background: rgba(255, 167, 38, 0.2); color: #FFA726; font-weight: 700;';
        codenameEl.className = 'val';
        break;
      case '2':
        codenameText += ' (Code 2 / Game Stopping Bug)';
        statusText = 'Stalled / Code 2';
        statusEl.style.cssText = 'background: rgba(255, 82, 82, 0.2); color: #FF5252; font-weight: 700;';
        codenameEl.className = 'val';
        break;
      case '3':
        codenameText += ' (Code 3 / Critical Issue)';
        statusText = 'Critical / Code 3';
        statusEl.style.cssText = 'background: rgba(255, 82, 82, 0.25); color: #FF5252; font-weight: 700; box-shadow: 0 0 10px rgba(255, 82, 82, 0.2);';
        codenameEl.className = 'val';
        break;
      case '4':
        codenameText += ' (Code 4 / 50% Cancelled)';
        statusText = 'Endangered / Code 4';
        statusEl.style.cssText = 'background: rgba(244, 67, 54, 0.2); color: #F44336; font-weight: 700;';
        codenameEl.className = 'val';
        break;
      case '5':
        codenameText += ' (Code 5 / Doomed)';
        statusText = 'Doomed / Code 5';
        statusEl.className = 'val status-pill cancelled-badge';
        statusEl.style.cssText = '';
        codenameEl.className = 'val';
        break;
      case '6':
        codenameText += ' (Code 6 / Discontinued)';
        statusText = 'Discontinued / Code 6';
        statusEl.className = 'val status-pill discontinued-badge';
        statusEl.style.cssText = '';
        codenameEl.className = 'val';
        break;
    }
    codenameEl.textContent = codenameText;
    statusEl.textContent = statusText;
  }

  function updatePublicDiagnosticLabels() {
    const labels = document.querySelectorAll('.diagnostic-spec-label');
    labels.forEach(label => {
      const game = label.getAttribute('data-game');
      if (game) {
        const savedCode = localStorage.getItem(`scw_bug_code_${game}`) || '0';
        let desc = 'Code 0: Bug Free';
        let styleColor = '#00E676';
        
        switch (savedCode) {
          case '0':
            desc = 'Code 0: Bug Free';
            styleColor = '#00E676';
            break;
          case '1':
            desc = 'Code 1: Buggy';
            styleColor = '#FFA726';
            break;
          case '2':
            desc = 'Code 2: Stalled';
            styleColor = '#FF5252';
            break;
          case '3':
            desc = 'Code 3: Critical';
            styleColor = '#FF5252';
            break;
          case '4':
            desc = 'Code 4: Unstable';
            styleColor = '#F44336';
            break;
          case '5':
            desc = 'Code 5: Doomed';
            styleColor = '#FF1744';
            break;
          case '6':
            desc = 'Code 6: Discontinued';
            styleColor = '#9E9E9E';
            break;
        }
        
        label.textContent = desc;
        label.style.color = styleColor;
      }
    });
  }

  const bugCodeSelects = document.querySelectorAll('.dev-bug-code-select');
  bugCodeSelects.forEach(select => {
    const game = select.getAttribute('data-game');
    if (game) {
      const savedCode = localStorage.getItem(`scw_bug_code_${game}`) || '0';
      select.value = savedCode;
      
      select.addEventListener('change', () => {
        const newCode = select.value;
        localStorage.setItem(`scw_bug_code_${game}`, newCode);
        playRetroSound('click');
        if (game === 'scw') updateSCWSpecsPanel();
        updatePublicDiagnosticLabels();
        console.log(`[Developer Diagnostics] ${game.toUpperCase()} bug level set to Code ${newCode}`);
      });
    }
  });

  updateSCWSpecsPanel();
  updatePublicDiagnosticLabels();

  // Initialize Crate Controller bindings
  const devCrateOverride = document.getElementById('dev-crate-override');
  if (devCrateOverride) {
    devCrateOverride.value = localStorage.getItem('scw_dev_crate_override') || 'random';
    devCrateOverride.addEventListener('change', () => {
      localStorage.setItem('scw_dev_crate_override', devCrateOverride.value);
      playRetroSound('click');
    });
  }

  const rateCommonEl = document.getElementById('crate-rate-common');
  const rateRareEl = document.getElementById('crate-rate-rare');
  const rateEpicEl = document.getElementById('crate-rate-epic');
  const rateLegendaryEl = document.getElementById('crate-rate-legendary');
  const rateUltraEl = document.getElementById('crate-rate-ultra');
  const btnSaveRates = document.getElementById('btn-save-crate-rates');

  if (rateCommonEl && rateRareEl && rateEpicEl && rateLegendaryEl && rateUltraEl) {
    const hasLuckBoost = activeCosmetics.includes('signed-nametag');
    rateCommonEl.value = localStorage.getItem('scw_crate_rate_common') || (hasLuckBoost ? '50' : '60');
    rateRareEl.value = localStorage.getItem('scw_crate_rate_rare') || (hasLuckBoost ? '25' : '20');
    rateEpicEl.value = localStorage.getItem('scw_crate_rate_epic') || (hasLuckBoost ? '15' : '12');
    rateLegendaryEl.value = localStorage.getItem('scw_crate_rate_legendary') || (hasLuckBoost ? '7.5' : '6');
    
    function calculateUltraRareRate() {
      const c = parseFloat(rateCommonEl.value) || 0;
      const r = parseFloat(rateRareEl.value) || 0;
      const e = parseFloat(rateEpicEl.value) || 0;
      const l = parseFloat(rateLegendaryEl.value) || 0;
      const u = Math.max(0, 100 - (c + r + e + l));
      rateUltraEl.value = u.toFixed(1).replace('.0', '');
    }

    [rateCommonEl, rateRareEl, rateEpicEl, rateLegendaryEl].forEach(input => {
      input.addEventListener('input', calculateUltraRareRate);
    });

    calculateUltraRareRate();

    if (btnSaveRates) {
      btnSaveRates.addEventListener('click', () => {
        const c = parseFloat(rateCommonEl.value) || 0;
        const r = parseFloat(rateRareEl.value) || 0;
        const e = parseFloat(rateEpicEl.value) || 0;
        const l = parseFloat(rateLegendaryEl.value) || 0;
        if (c + r + e + l > 100) {
          alert("❌ Error: Total rates sum cannot exceed 100%!");
          return;
        }
        localStorage.setItem('scw_crate_rate_common', rateCommonEl.value);
        localStorage.setItem('scw_crate_rate_rare', rateRareEl.value);
        localStorage.setItem('scw_crate_rate_epic', rateEpicEl.value);
        localStorage.setItem('scw_crate_rate_legendary', rateLegendaryEl.value);
        playRetroSound('purchase');
        alert("📊 Crate drop rates successfully saved and updated!");
      });
    }
  }

  // Load and query user directory (for Dev secrets accounts viewer)
  function loadUserDirectory() {
    const tbody = document.getElementById('user-directory-tbody');
    if (!tbody) return;

    // We build a collection of active accounts to show
    let userProfiles = [];

    // Fetch current local storage user profile safely
    const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
    const isDevSession = isDeveloperEmail(localEmail);

    // 1. Add static mock accounts for flavor
    userProfiles.push({
      uid: "mock_dev",
      username: isDevSession ? `${localUser.displayName || localEmail} (Dev)` : "catnip (Dev)",
      email: isDevSession ? localEmail : "dev@catnipstudios.com",
      coins: isDevSession ? userCoins : 9999,
      cosmetics: ["golden-name", "purple-border", "crown-badge", "sound-pack"],
      status: isDevSession ? "Staff / Online (Dev)" : "Staff / Offline"
    });



    // 2. Fetch current local storage user or display guest profile progress
    if (localUser) {
      if (!isDevSession) {
        userProfiles.push({
          uid: "local_user",
          username: localUser.displayName || "Local Fallback User",
          email: localUser.email || "local@localStorage",
          coins: userCoins,
          cosmetics: ownedItems,
          status: "Active Session (Local)"
        });
      }
    } else {
      userProfiles.push({
        uid: "guest_user",
        username: "Guest Profile (You)",
        email: "guest@localStorage",
        coins: userCoins,
        cosmetics: ownedItems,
        status: "Active Session (Guest)"
      });
    }

    // 2b. Add other local accounts from local profiles database
    try {
      const localDb = JSON.parse(localStorage.getItem('scw_local_profiles_database') || '[]');
      localDb.forEach(profile => {
        const emailLower = (profile.email || '').toLowerCase();
        // Avoid duplicate active session or mock developer accounts
        const exists = userProfiles.some(p => (p.email || '').toLowerCase() === emailLower);
        if (!exists && emailLower !== 'dev@catnipstudios.com') {
          userProfiles.push({
            uid: `local_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`,
            username: profile.username || emailLower.split('@')[0] || 'Local User',
            email: profile.email || 'local@user',
            coins: profile.coins || 0,
            cosmetics: profile.cosmetics || [],
            status: "Offline (Local)"
          });
        }
      });
    } catch(e) {
      console.warn("Failed loading local profiles database:", e);
    }

    // 3. If Firebase Firestore is active, query the database dynamically
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        db.collection('users').get().then((snapshot) => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const uid = doc.id;
            
            // Check if user is already added (e.g. avoid duplicate of local session)
            const isSelf = firebase.auth().currentUser && firebase.auth().currentUser.uid === uid;
            const username = data.username || data.displayName || (isSelf && firebase.auth().currentUser.displayName) || `Player_${uid.substring(0, 5)}`;
            const email = data.email || (isSelf && firebase.auth().currentUser.email) || "cloud@firestore";
            
            // Add or overwrite local user reference with cloud synced data
            const existingIdx = userProfiles.findIndex(p => p.email === email);
            const profile = {
              uid: uid,
              username: username,
              email: email,
              coins: data.coins || 0,
              cosmetics: data.ownedItems || [],
              status: isSelf ? "Active Session (Cloud)" : "Offline (Cloud)"
            };

            if (existingIdx >= 0) {
              userProfiles[existingIdx] = profile;
            } else {
              userProfiles.push(profile);
            }
          });
          
          renderUserDirectoryTable(userProfiles);
        }).catch((err) => {
          console.warn("Firestore directory read error:", err);
          renderUserDirectoryTable(userProfiles);
        });
      } catch (e) {
        renderUserDirectoryTable(userProfiles);
      }
    } else {
      renderUserDirectoryTable(userProfiles);
    }
  }

  function renderUserDirectoryTable(profiles) {
    const tbody = document.getElementById('user-directory-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    profiles.forEach((profile) => {
      const row = document.createElement('tr');
      const cosmeticBadges = profile.cosmetics.map(c => {
        const name = c.replace('-', ' ');
        return `<span class="status-badge" style="background: rgba(124, 77, 255, 0.15); color: #7C4DFF; font-size: 0.75rem; padding: 2px 6px; margin: 2px; border-radius: 4px; display: inline-block;">${name}</span>`;
      }).join(' ') || '<span style="color: var(--color-text-muted); font-size: 0.85rem;">None</span>';

      const statusColor = profile.status.includes('Active') ? '#00E676' : 'var(--color-text-muted)';

      row.innerHTML = `
        <td style="font-weight: 600;">${escapeHtml(profile.username)}</td>
        <td style="font-family: monospace; font-size: 0.85rem; color: var(--color-text-secondary);">${escapeHtml(profile.email)}</td>
        <td style="color: #FFD700; font-weight: 700;">
          <img src="coin.png" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;" /> ${profile.coins}
        </td>
        <td>${cosmeticBadges}</td>
        <td>
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; margin-right: 6px; vertical-align: middle;"></span>
          <span style="font-size: 0.85rem; color: ${statusColor}; font-weight: 600;">${escapeHtml(profile.status)}</span>
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary btn-admin-add-coins" data-uid="${profile.uid}" data-username="${escapeHtml(profile.username)}" style="padding: 2px 8px; font-size: 0.75rem; min-height: auto; font-weight: 700;">+ Add</button>
            <button class="btn btn-secondary btn-admin-remove-coins" data-uid="${profile.uid}" data-username="${escapeHtml(profile.username)}" style="padding: 2px 8px; font-size: 0.75rem; min-height: auto; border-color: #FF5252; color: #FF5252; font-weight: 700;">- Remove</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Add click listeners to admin buttons
    const addBtns = tbody.querySelectorAll('.btn-admin-add-coins');
    const removeBtns = tbody.querySelectorAll('.btn-admin-remove-coins');

    addBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-uid');
        const username = btn.getAttribute('data-username');
        adminModifyCoins(uid, username, 'add');
      });
    });

    removeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-uid');
        const username = btn.getAttribute('data-username');
        adminModifyCoins(uid, username, 'remove');
      });
    });
  }

  function adminModifyCoins(uid, username, action) {
    const actionLabel = action === 'add' ? 'ADD to' : 'REMOVE from';
    const input = prompt(`🛡️ Admin Console\n\nEnter the number of Catnip Coins to ${actionLabel} ${username}'s balance:`);
    if (input === null) return; // cancel

    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("❌ Invalid amount specified.");
      return;
    }

    // Play coin synthesizer sound effect
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(action === 'add' ? 987.77 : 587.33, now); // B5 or D5
      osc.frequency.setValueAtTime(action === 'add' ? 1318.51 : 293.66, now + 0.08); // E6 or D4
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch(e) {}

    if (uid === 'mock_dev') {
      alert(`🛡️ Mock Action: Simulating successfully modifying coins for dev.`);
      return;
    }

    if (uid === 'local_user' || uid === 'guest_user') {
      // Modify local coin state
      if (action === 'add') {
        userCoins += amount;
      } else {
        userCoins = Math.max(0, userCoins - amount);
      }
      localStorage.setItem('scw_coins_balance', userCoins.toString());
      
      // Update portal UI elements
      updateCoinUI();
      
      // Reload directory
      loadUserDirectory();
      alert(`🛡️ Local user coins updated! New balance: ${userCoins}`);
    } else {
      // Modify Firestore user account
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(uid);

        userRef.get().then(doc => {
          if (doc.exists) {
            const currentCoins = doc.data().coins || 0;
            let newCoins = currentCoins;
            if (action === 'add') {
              newCoins += amount;
            } else {
              newCoins = Math.max(0, currentCoins - amount);
            }
            
            userRef.update({ coins: newCoins }).then(() => {
              alert(`🛡️ Firestore balance updated successfully for ${username}! New balance: ${newCoins}`);
              // If we edited ourselves, update local state too
              const currentUser = firebase.auth().currentUser;
              if (currentUser && currentUser.uid === uid) {
                userCoins = newCoins;
                localStorage.setItem('scw_coins_balance', userCoins.toString());
                updateCoinUI();
              }
              loadUserDirectory();
            }).catch(err => {
              alert(`❌ Failed to update Firestore: ${err.message}`);
            });
          } else {
            // User document doesn't exist yet, initialize it
            let newCoins = action === 'add' ? amount : 0;
            userRef.set({ coins: newCoins, username: username }).then(() => {
              alert(`🛡️ Firestore document created and balance set for ${username}! Balance: ${newCoins}`);
              loadUserDirectory();
            }).catch(err => {
              alert(`❌ Failed to create document in Firestore: ${err.message}`);
            });
          }
        }).catch(err => {
          alert(`❌ Failed to retrieve user doc: ${err.message}`);
        });
      } else {
        alert("❌ Firestore is not initialized.");
      }
    }
  }

  // ==================== AMBIENT MUSIC SYNTHESIZER (MINECRAFT C418 STYLE) ====================
  let musicAudioCtx = null;
  let musicDelayNode = null;
  let musicFeedbackNode = null;
  let musicIntervalId = null;
  let isMusicPlaying = false;
  let currentChordIndex = 0;

  // Custom composed phrases inspired by the warm chord cycles of C418's Sweden and Wet Hands (Key: G Major / E minor)
  const melodyPhrases = [
    // Phrase 0: Sweden-style G Major opener (gentle stepping notes)
    [
      { note: 246.94, delay: 0.0 },  // B3
      { note: 293.66, delay: 1.2 },  // D4
      { note: 392.00, delay: 2.4 },  // G4
      { note: 293.66, delay: 3.6 }   // D4
    ],
    // Phrase 1: Wet Hands-style C major lift (flowing arpeggiations)
    [
      { note: 329.63, delay: 0.0 },  // E4
      { note: 392.00, delay: 0.8 },  // G4
      { note: 493.88, delay: 1.6 },  // B4
      { note: 523.25, delay: 2.4 },  // C5
      { note: 493.88, delay: 3.6 }   // B4
    ],
    // Phrase 2: Melancholic D major transition
    [
      { note: 293.66, delay: 0.0 },  // D4
      { note: 369.99, delay: 1.2 },  // F#4
      { note: 440.00, delay: 2.4 },  // A4
      { note: 369.99, delay: 3.6 }   // F#4
    ],
    // Phrase 3: Sweden-style E minor resolution
    [
      { note: 392.00, delay: 0.0 },  // G4
      { note: 493.88, delay: 1.2 },  // B4
      { note: 659.25, delay: 2.4 },  // E5
      { note: 493.88, delay: 3.6 }   // B4
    ]
  ];

  // Synthesize a warm, resonant acoustic piano key strike using physical harmonic modeling
  function playPianoNote(freq, noteStart) {
    if (!musicAudioCtx) return;
    
    // Fundamental + 2 higher harmonics for natural, bright piano spectrum
    const harmonics = [
      { ratio: 1, gain: 0.10, type: 'sine', detune: 3 },
      { ratio: 2, gain: 0.035, type: 'triangle', detune: -3 },
      { ratio: 3, gain: 0.012, type: 'sine', detune: 5 }
    ];

    harmonics.forEach((h) => {
      const osc = musicAudioCtx.createOscillator();
      const gainNode = musicAudioCtx.createGain();
      
      osc.type = h.type;
      osc.frequency.setValueAtTime(freq * h.ratio, noteStart);
      osc.detune.setValueAtTime(h.detune, noteStart);
      
      osc.connect(gainNode);
      
      // Connect to speakers (dry) & to the global feedback delay loop (wet)
      gainNode.connect(musicAudioCtx.destination);
      if (musicDelayNode) {
        gainNode.connect(musicDelayNode);
      }
      
      // ADSR envelope: extremely sharp hammer strike attack + exponential decay/release
      const attack = 0.008; // immediate strike
      const decay = 0.45 / h.ratio; // higher harmonics fade out faster
      const release = 4.2; 
      
      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(h.gain, noteStart + attack);
      gainNode.gain.exponentialRampToValueAtTime(h.gain * 0.35, noteStart + attack + decay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + attack + decay + release);
      
      osc.start(noteStart);
      osc.stop(noteStart + attack + decay + release + 0.1);
    });
  }

  function playSoftAmbientPhrase() {
    if (!musicAudioCtx || musicAudioCtx.state === 'suspended') return;
    try {
      const now = musicAudioCtx.currentTime;
      
      // 1. Play deep, warm grounding bass note (damper resonance)
      const bassNotes = [98.00, 130.81, 146.83, 164.81]; // G2, C3, D3, E3
      const bassFreq = bassNotes[currentChordIndex % bassNotes.length];
      
      const bassOsc = musicAudioCtx.createOscillator();
      const bassGain = musicAudioCtx.createGain();
      
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      
      bassOsc.connect(bassGain);
      bassGain.connect(musicAudioCtx.destination);
      
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.03, now + 1.2); // swell in
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5);
      
      bassOsc.start(now);
      bassOsc.stop(now + 7.7);

      // 2. Play acoustic arpeggiated piano melody notes staggered in time
      const phrase = melodyPhrases[currentChordIndex];
      phrase.forEach(p => {
        playPianoNote(p.note, now + p.delay);
      });

      // Advance phrase index
      currentChordIndex = (currentChordIndex + 1) % melodyPhrases.length;
    } catch(e) {
      console.warn("Piano music arpeggiation error:", e);
    }
  }

  function startAmbientMusic() {
    try {
      if (!musicAudioCtx) {
        musicAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create C418-style cozy feedback tape delay effect
        musicDelayNode = musicAudioCtx.createDelay(1.5);
        musicFeedbackNode = musicAudioCtx.createGain();
        
        musicDelayNode.delayTime.value = 0.55; // 550ms delay time (slow, dreamy echo)
        musicFeedbackNode.gain.value = 0.38;   // 38% feedback echo strength
        
        // Connect feedback loop: Delay -> Feedback -> Delay
        musicDelayNode.connect(musicFeedbackNode);
        musicFeedbackNode.connect(musicDelayNode);
        
        // Connect delay feedback to speakers
        musicFeedbackNode.connect(musicAudioCtx.destination);
      }
      if (musicAudioCtx.state === 'suspended') {
        musicAudioCtx.resume();
      }
      
      // Randomize starting phrase so it sounds fresh on every toggle trigger
      currentChordIndex = Math.floor(Math.random() * melodyPhrases.length);
      
      // Play first phrase immediately, then cycle every 11 seconds
      playSoftAmbientPhrase();
      musicIntervalId = setInterval(playSoftAmbientPhrase, 11000);
      isMusicPlaying = true;
      updateMusicButtonUI();
    } catch(e) {
      console.warn("Failed to initiate ambient audio context:", e);
    }
  }

  function stopAmbientMusic() {
    if (musicIntervalId) {
      clearInterval(musicIntervalId);
      musicIntervalId = null;
    }
    isMusicPlaying = false;
    updateMusicButtonUI();
  }

  function toggleAmbientMusic() {
    if (isMusicPlaying) {
      stopAmbientMusic();
    } else {
      startAmbientMusic();
    }
  }

  function updateMusicButtonUI() {
    const btn = document.getElementById('ambient-music-btn');
    if (!btn) return;
    const icon = btn.querySelector('.music-icon');
    const text = btn.querySelector('.music-text');
    if (isMusicPlaying) {
      if (icon) icon.textContent = '🔊';
      if (text) text.textContent = 'Music: ON';
      btn.classList.add('music-active');
    } else {
      if (icon) icon.textContent = '🔇';
      if (text) text.textContent = 'Music: OFF';
      btn.classList.remove('music-active');
    }
  }

  const musicBtn = document.getElementById('ambient-music-btn');
  if (musicBtn) {
    musicBtn.addEventListener('click', toggleAmbientMusic);
  }

  // ==================== DAILY ADVENTURE JOURNAL SYSTEM (COOLDOWN VALIDATED) ====================
  function updateExchangeTerminal() {
    const journalText = document.getElementById('journal-text-input');
    const journalCoins = document.getElementById('journal-coins-input');
    const btnSubmit = document.getElementById('btn-submit-journal');
    const timerLabel = document.getElementById('journal-cooldown-timer');
    const conversionPreview = document.getElementById('journal-conversion-preview');
    const journalFeedback = document.getElementById('journal-feedback');
    const historyBox = document.getElementById('journal-history-box');
    const historyList = document.getElementById('journal-history-list');

    if (!btnSubmit) return;

    // 1. Get logged in user details
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    } catch(e) {}

    if (!user) {
      if (journalFeedback) {
        journalFeedback.innerHTML = `<span style="color: #FF5252; font-weight: 700;">🔒 Account Required</span><br><span style="font-size: 0.8rem; color: var(--color-text-secondary);">Please sign in above to write adventure logs and claim coins.</span>`;
      }
      if (journalText) journalText.disabled = true;
      if (journalCoins) journalCoins.disabled = true;
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = '0.5';
      if (historyBox) historyBox.style.display = 'none';
      return;
    }

    const username = (user.displayName || user.email.split('@')[0] || '').trim();

    // Enable inputs by default
    if (journalText) journalText.disabled = false;
    if (journalCoins) journalCoins.disabled = false;
    btnSubmit.disabled = false;
    btnSubmit.style.opacity = '1';
    if (journalFeedback) journalFeedback.innerHTML = '';

    // 2. Render Check-in History Logs
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('scw_journal_history_' + username.toLowerCase()) || '[]');
    } catch(e) {}

    if (historyList && historyBox) {
      if (history.length > 0) {
        historyBox.style.display = 'block';
        historyList.innerHTML = '';
        // Render last 3 entries
        history.slice(-3).reverse().forEach(entry => {
          const div = document.createElement('div');
          div.style.fontSize = '0.8rem';
          div.style.background = 'rgba(255,255,255,0.01)';
          div.style.border = '1px solid var(--border-light)';
          div.style.borderRadius = '6px';
          div.style.padding = '8px';
          div.style.color = 'var(--color-text-secondary)';
          div.style.lineHeight = '1.4';
          div.innerHTML = `<span style="color: var(--color-text-muted); font-size: 0.7rem; display: block; font-weight: 600;">${entry.date}</span><strong>${escapeHtml(entry.text)}</strong> (+${entry.reward} Catnip Coins)`;
          historyList.appendChild(div);
        });
      } else {
        historyBox.style.display = 'none';
      }
    }

    // 3. Check Cooldown timer (24 hours = 86,400,000 ms)
    const cooldown = 24 * 60 * 60 * 1000;
    let lastLogTime = 0;
    try {
      lastLogTime = parseInt(localStorage.getItem('scw_last_journal_timestamp_' + username.toLowerCase()) || '0', 10);
    } catch(e) {}

    const now = Date.now();
    const elapsed = now - lastLogTime;

    if (elapsed < cooldown) {
      // Cooldown is active! Disable fields.
      if (journalText) journalText.disabled = true;
      if (journalCoins) journalCoins.disabled = true;
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = '0.5';

      const remaining = cooldown - elapsed;
      const hours = Math.floor(remaining / (3600 * 1000));
      const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));

      if (timerLabel) {
        timerLabel.textContent = `Cooldown active`;
        timerLabel.style.color = '#FF5252';
      }

      if (journalFeedback) {
        journalFeedback.innerHTML = `<span style="color: #FF5252; font-weight: 600;">Log Locked</span><br><span style="font-size: 0.8rem; color: var(--color-text-muted);">You already checked in today! Come back in <strong>${hours}h ${mins}m</strong> to log your next adventure.</span>`;
      }
    } else {
      if (timerLabel) {
        timerLabel.textContent = `Ready to Log`;
        timerLabel.style.color = 'var(--color-primary)';
      }
    }
  }

  // Register Daily Journal Submit Listeners
  const btnSubmitJournal = document.getElementById('btn-submit-journal');
  const journalTextInput = document.getElementById('journal-text-input');
  const journalCoinsInput = document.getElementById('journal-coins-input');
  const journalPreview = document.getElementById('journal-conversion-preview');

  if (journalCoinsInput && journalPreview) {
    // Dynamic preview: 5 SCW coins = 1 Catnip coin + 10 check-in reward
    journalCoinsInput.addEventListener('input', () => {
      const val = parseInt(journalCoinsInput.value, 10) || 0;
      if (val < 0) {
        journalCoinsInput.value = '0';
      }
      const earned = Math.floor(Math.min(val, 500) / 5) + 10;
      journalPreview.textContent = `+${earned}`;
    });
  }

  if (btnSubmitJournal) {
    btnSubmitJournal.addEventListener('click', () => {
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      } catch(e) {}
      if (!user) return;

      const username = (user.displayName || user.email.split('@')[0] || '').trim();
      const text = (journalTextInput ? journalTextInput.value : '').trim();
      let coins = parseInt(journalCoinsInput ? journalCoinsInput.value : '0', 10) || 0;

      if (!text) {
        const fb = document.getElementById('journal-feedback');
        if (fb) fb.innerHTML = `<span style="color: #FF5252; font-weight: 600;">Please write a journal entry.</span>`;
        return;
      }

      // Cap at 500 coins
      if (coins > 500) coins = 500;
      if (coins < 0) coins = 0;

      const reward = Math.floor(coins / 5) + 10;

      // 1. Save timestamp and entry
      const now = Date.now();
      localStorage.setItem('scw_last_journal_timestamp_' + username.toLowerCase(), now.toString());

      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('scw_journal_history_' + username.toLowerCase()) || '[]');
      } catch(e) {}

      const newEntry = {
        text: text,
        coins: coins,
        reward: reward,
        timestamp: now,
        date: new Date().toLocaleDateString()
      };

      history.push(newEntry);
      localStorage.setItem('scw_journal_history_' + username.toLowerCase(), JSON.stringify(history));

      // 2. Add Coins
      if (typeof addCoins === 'function') {
        addCoins(reward, btnSubmitJournal);
      }

      // Increment Journal & Coin Exchange Quests and Award XP
      incrementQuestProgress('journal_write');
      if (typeof addXP === 'function') addXP(50);
      if (text.length >= 100) {
        incrementQuestProgress('journal_chars');
      }
      const lowerText = text.toLowerCase();
      if (lowerText.includes('smash') || lowerText.includes('among') || lowerText.includes('world') || lowerText.includes('brawler') || lowerText.includes('game') || lowerText.includes('kart') || lowerText.includes('feline')) {
        incrementQuestProgress('journal_mention');
      }
      if (coins > 0) {
        incrementQuestProgress('scw_exchange', coins);
        incrementQuestProgress('scw_import');
        if (typeof addXP === 'function') addXP(40);
      }
      
      // Check streak achievements/quests
      const streakVal = parseInt(localStorage.getItem('scw_stats_journalStreak') || '0', 10);
      if (streakVal >= 3) {
        incrementQuestProgress('journal_streak_3');
      }

      // 3. Sync to Firestore (optional adventure log history collection)
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          const db = firebase.firestore();
          db.collection('adventure_logs').add({
            username: username,
            text: text,
            coins: coins,
            reward: reward,
            timestamp: now,
            date: newEntry.date
          });
        } catch(err) {
          console.warn("Firestore journal sync offline:", err);
        }
      }

      // Reset fields
      if (journalTextInput) journalTextInput.value = '';
      if (journalCoinsInput) journalCoinsInput.value = '';
      if (journalPreview) journalPreview.textContent = '+10';

      // Refresh UI
      updateExchangeTerminal();
    });
  }

  // Hook terminal update to page load
  setTimeout(updateExchangeTerminal, 600);

  // ==================== URL QUERY PARAMETER CLAIM HANDLER & MODAL ====================
  const claimModal = document.getElementById('claim-confirmation-modal');
  const btnCloseClaim = document.getElementById('btn-close-claim-modal');
  const btnCancelClaim = document.getElementById('btn-cancel-claim');
  const btnAcceptClaim = document.getElementById('btn-accept-claim');
  const confirmScwDisplay = document.getElementById('confirm-scw-coins');
  const confirmRewardDisplay = document.getElementById('confirm-catnip-reward');
  const claimModalTag = document.getElementById('claim-modal-tag');
  const claimModalTitle = document.getElementById('claim-modal-title');
  const claimModalDesc = document.getElementById('claim-modal-desc');

  let activeScwCoins = 0;
  let activeCatnipReward = 0;
  let activeGameType = 'scw';

  function showExchangeConfirmationModal(scwCoins, reward, gameType = 'scw') {
    if (!claimModal) return;
    activeScwCoins = scwCoins;
    activeCatnipReward = reward;
    activeGameType = gameType;

    if (confirmRewardDisplay) confirmRewardDisplay.textContent = reward;

    if (gameType === 'ssc') {
      if (claimModalTag) claimModalTag.textContent = '💥 Smash Brawl Victory';
      if (claimModalTitle) claimModalTitle.textContent = 'Defeated Opponent';
      if (claimModalDesc) {
        claimModalDesc.innerHTML = `
          You defeated an opponent in <strong>Super Smash Cats</strong>!
          <br><br>
          Claim your victory reward:
          <br>
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-primary); display: block; margin: 10px 0;">+<span id="confirm-catnip-reward">${reward}</span> Catnip Coins</span>
        `;
      }
    } else if (gameType === 'cau') {
      if (claimModalTag) claimModalTag.textContent = '🚀 Cats Among Us Victory';
      if (claimModalTitle) claimModalTitle.textContent = 'Crew Victory';
      if (claimModalDesc) {
        claimModalDesc.innerHTML = `
          You survived and won a match in <strong>Cats Among Us</strong>!
          <br><br>
          Claim your victory reward:
          <br>
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-primary); display: block; margin: 10px 0;">+<span id="confirm-catnip-reward">${reward}</span> Catnip Coins</span>
        `;
      }
    } else {
      if (claimModalTag) claimModalTag.textContent = '🎮 Game Session Detected';
      if (claimModalTitle) claimModalTitle.textContent = 'Convert Game Coins';
      if (claimModalDesc) {
        claimModalDesc.innerHTML = `
          You cleared levels in <strong>Super Cat World</strong> and collected <strong><span id="confirm-scw-coins" style="color: #FFD700; font-weight: 700;">${scwCoins}</span> SCW Coins</strong>!
          <br><br>
          Convert them now to claim:
          <br>
          <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-primary); display: block; margin: 10px 0;">+<span id="confirm-catnip-reward">${reward}</span> Catnip Coins</span>
        `;
      }
    }

    claimModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Expose it globally so updateAuthStateUI can see it
  window.showExchangeConfirmationModal = showExchangeConfirmationModal;

  function closeClaimModal() {
    if (claimModal) {
      claimModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  if (btnCloseClaim) btnCloseClaim.addEventListener('click', closeClaimModal);
  if (btnCancelClaim) btnCancelClaim.addEventListener('click', closeClaimModal);
  
  if (claimModal) {
    claimModal.addEventListener('click', (e) => {
      if (e.target === claimModal) closeClaimModal();
    });
  }

  if (btnAcceptClaim) {
    btnAcceptClaim.addEventListener('click', () => {
      if (activeCatnipReward > 0) {
        // Enforce anti-cheat validations
        if (activeGameType === 'ssc') {
          if (activeCatnipReward !== 15) {
            alert("🛡️ Arena Judgement: Invalid claim reward amount! The judges only award exactly 15 coins per victory.");
            closeClaimModal();
            return;
          }
          
          const today = new Date().toDateString();
          let dailyClaims = JSON.parse(localStorage.getItem('ssc_daily_claims') || '{"date":"","count":0}');
          if (dailyClaims.date !== today) {
            dailyClaims = { date: today, count: 0 };
          }
          if (dailyClaims.count >= 5) {
            alert("🛡️ Arena Judgement: Daily brawler limit reached! You can claim a maximum of 5 victory rewards (75 Catnip Coins) per day.");
            closeClaimModal();
            return;
          }
          dailyClaims.count++;
          localStorage.setItem('ssc_daily_claims', JSON.stringify(dailyClaims));
        } else if (activeGameType === 'cau') {
          const validRoles = { innocent: 25, impostor: 45, engineer: 30, captain: 50, guard: 35, medic: 30, detective: 25 };
          const base = validRoles[activeCauRole];
          if (!base) {
            alert("🛡️ Security Alert: Invalid Cats Among Us role detected!");
            closeClaimModal();
            return;
          }
          const expectedReward = base + Math.min(29, Math.max(0, activeCauExtraCats)) * 5;
          if (activeCatnipReward !== expectedReward) {
            alert("🛡️ Security Alert: Reward mismatch detected!");
            closeClaimModal();
            return;
          }
          const today = new Date().toDateString();
          let dailyClaims = JSON.parse(localStorage.getItem('cau_daily_claims') || '{"date":"","count":0}');
          if (dailyClaims.date !== today) {
            dailyClaims = { date: today, count: 0 };
          }
          if (dailyClaims.count >= 5) {
            alert("🛡️ Security Alert: Daily Cats Among Us reward limit reached! You can claim a maximum of 5 victory rewards per day.");
            closeClaimModal();
            return;
          }
          dailyClaims.count++;
          localStorage.setItem('cau_daily_claims', JSON.stringify(dailyClaims));

          // Increment customization stats
          victoryCount++;
          gamesPlayed++;
          localStorage.setItem('scw_victory_count', victoryCount.toString());
          localStorage.setItem('scw_games_played', gamesPlayed.toString());
          localStorage.setItem('scw_max_lobby_cats', Math.max(parseInt(localStorage.getItem('scw_max_lobby_cats') || '0', 10), activeCauExtraCats).toString());
          
          if (typeof addXP === 'function') {
            addXP(60);  // Play Cats Among Us
            addXP(100); // Win Cats Among Us
          }

          if (typeof incrementQuestProgress === 'function') {
            incrementQuestProgress('among_play');
            incrementQuestProgress('among_win');
            if (activeCauRole) {
              incrementQuestProgress('among_win', 1, 'among_win_' + activeCauRole);
            }
          }
        } else if (activeGameType === 'scw') {
          // Increment customization stats
          gamesPlayed++;
          localStorage.setItem('scw_games_played', gamesPlayed.toString());
          if (activeScwCoins > 0) {
            incrementQuestProgress('scw_exchange', activeScwCoins);
            incrementQuestProgress('scw_import');
            if (typeof addXP === 'function') addXP(40);
          }
        }

        if (typeof addCoins === 'function') {
          addCoins(activeCatnipReward, btnAcceptClaim);
        }
      }
      closeClaimModal();
    });
  }

  function handleUrlCoinClaims() {
    const urlParams = new URLSearchParams(window.location.search);
    const claimCoinsParam = urlParams.get('claim_coins');
    const claimSmashParam = urlParams.get('claim_smash_coins');
    const claimAmongUsRole = urlParams.get('claim_amongus_role');
    const claimAmongUsExtra = parseInt(urlParams.get('claim_amongus_extra_cats') || '0', 10);

    if (!claimCoinsParam && !claimSmashParam && !claimAmongUsRole) return;

    // Clean URL query parameters immediately using history API to prevent refresh double-claim
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, newUrl);

    // Check logged in user
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    } catch(e) {}

    if (claimCoinsParam) {
      const coinsToExchange = parseInt(claimCoinsParam, 10) || 0;
      if (coinsToExchange <= 0) return;
      const reward = Math.floor(coinsToExchange / 5);

      if (user) {
        setTimeout(() => {
          showExchangeConfirmationModal(coinsToExchange, reward, 'scw');
        }, 1000);
      } else {
        localStorage.setItem('scw_pending_claim_coins', coinsToExchange.toString());
        alert(`🎮 Game Session Found!\n\nYou have +${reward} Catnip Coins (${coinsToExchange} SCW Coins) pending! Please Sign In or Create an Account above to claim them.`);
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
          authModal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    } else if (claimSmashParam) {
      const smashReward = parseInt(claimSmashParam, 10) || 0;
      if (smashReward !== 15) {
        alert("🛡️ Arena Judgement: Invalid coin claim amount detected! The judges only award exactly 15 coins per victory.");
        return;
      }
      const today = new Date().toDateString();
      let dailyClaims = JSON.parse(localStorage.getItem('ssc_daily_claims') || '{"date":"","count":0}');
      if (dailyClaims.date !== today) {
        dailyClaims = { date: today, count: 0 };
      }
      if (dailyClaims.count >= 5) {
        alert("🛡️ Arena Judgement: Daily brawler limit reached! You can claim a maximum of 5 victory rewards (75 Catnip Coins) per day. Check back tomorrow!");
        return;
      }
      if (user) {
        setTimeout(() => {
          showExchangeConfirmationModal(0, smashReward, 'ssc');
        }, 1000);
      } else {
        localStorage.setItem('ssc_pending_claim_coins', smashReward.toString());
        alert(`💥 Battle Victory Found!\n\nYou have +${smashReward} Catnip Coins pending from Super Smash Cats! Please Sign In or Create an Account above to claim them.`);
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
          authModal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    } else if (claimAmongUsRole) {
      const role = claimAmongUsRole.toLowerCase();
      const validRoles = { innocent: 25, impostor: 45, engineer: 30, captain: 50, guard: 35, medic: 30, detective: 25 };
      const base = validRoles[role];
      if (!base) {
        alert("🛡️ Security Alert: Invalid Cats Among Us role detected!");
        return;
      }
      const extraCats = Math.min(29, Math.max(0, claimAmongUsExtra));
      const totalReward = base + extraCats * 5;

      const today = new Date().toDateString();
      let dailyClaims = JSON.parse(localStorage.getItem('cau_daily_claims') || '{"date":"","count":0}');
      if (dailyClaims.date !== today) {
        dailyClaims = { date: today, count: 0 };
      }
      if (dailyClaims.count >= 5) {
        alert("🛡️ Security Alert: Daily Cats Among Us reward limit reached! You can claim a maximum of 5 victory rewards per day. Check back tomorrow!");
        return;
      }

      activeCauRole = role;
      activeCauExtraCats = extraCats;

      if (user) {
        setTimeout(() => {
          showExchangeConfirmationModal(0, totalReward, 'cau');
        }, 1000);
      } else {
        localStorage.setItem('cau_pending_claim_coins', totalReward.toString());
        localStorage.setItem('cau_pending_claim_role', role);
        localStorage.setItem('cau_pending_claim_extra', extraCats.toString());
        alert(`🚀 Cats Among Us Session Found!\n\nYou have +${totalReward} Catnip Coins pending! Please Sign In or Create an Account above to claim them.`);
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
          authModal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    }
  }

  // Run URL claim check on page load
  setTimeout(handleUrlCoinClaims, 1500);

  // ==================== AVATAR MIX-AND-MATCH PROFILE CUSTOMS SYSTEM ====================

  function applyAvatarComposite(catId, expressionId, catElement, exprElement, decorElement) {
    if (!catElement) return;

    let baseEmoji = '🐱';
    
    if (catId === 'cat_grumpy') {
      baseEmoji = '😾';
    } else if (catId === 'cat_silly') {
      baseEmoji = '😸';
    } else {
      switch (expressionId) {
        case 'expr_happy': baseEmoji = '😺'; break;
        case 'expr_excited': baseEmoji = '😸'; break;
        case 'expr_confident': baseEmoji = '😼'; break;
        case 'expr_angry': baseEmoji = '😾'; break;
        case 'expr_surprised': baseEmoji = '🙀'; break;
        case 'expr_laughing': baseEmoji = '😹'; break;
        case 'expr_sleepy': baseEmoji = '😿'; break;
        case 'expr_cool': baseEmoji = '😼'; break;
        case 'expression-scared': baseEmoji = '🙀'; break;
        case 'expression-frosty': baseEmoji = '🥶'; break;
        case 'expression-blossom': baseEmoji = '😸'; break;
        case 'expression-exuberant': baseEmoji = '🥳'; break;
        default: baseEmoji = '🐱'; break;
      }
    }

    catElement.textContent = baseEmoji;

    catElement.style.filter = 'none';
    catElement.style.textShadow = 'none';
    catElement.classList.remove('rainbow-cat-active');
    if (exprElement) {
      exprElement.textContent = '';
      exprElement.style.cssText = 'position: absolute; z-index: 2; pointer-events: none;';
    }
    if (decorElement) {
      decorElement.textContent = '';
      decorElement.style.cssText = 'position: absolute; z-index: 4; pointer-events: none;';
    }

    switch (catId) {
      case 'cat_orange':
        catElement.style.filter = 'sepia(0.95) saturate(5.5) hue-rotate(-20deg) brightness(0.95)';
        break;
      case 'cat_black':
        catElement.style.filter = 'brightness(0.18) contrast(1.5)';
        break;
      case 'cat_white':
        catElement.style.filter = 'brightness(1.5) grayscale(1)';
        break;
      case 'cat_tuxedo':
        catElement.style.filter = 'brightness(0.3) contrast(1.8) drop-shadow(1px 1px 0px #FFF)';
        break;
      case 'cat_brown':
        catElement.style.filter = 'sepia(0.85) brightness(0.5) saturate(1.2)';
        break;
      case 'cat_calico':
        catElement.style.filter = 'sepia(0.7) saturate(3) hue-rotate(-15deg) brightness(0.75) contrast(1.2)';
        break;
      case 'cat_grey':
        catElement.style.filter = 'grayscale(1) brightness(0.7)';
        break;
      case 'cat_siamese':
        catElement.style.filter = 'sepia(0.75) brightness(0.8) contrast(1.2)';
        break;
      
      case 'cat_king':
        if (decorElement) {
          decorElement.textContent = '👑';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_robot':
        catElement.style.filter = 'grayscale(1) contrast(1.3) brightness(0.95)';
        if (decorElement) {
          decorElement.textContent = '🤖';
          decorElement.style.top = '10px';
          decorElement.style.right = '-2px';
          decorElement.style.fontSize = '0.9rem';
          decorElement.style.opacity = '0.7';
        }
        break;
      case 'cat_developer':
        catElement.style.filter = 'sepia(0.5) saturate(1.8) hue-rotate(240deg) brightness(0.95)';
        if (decorElement) {
          decorElement.textContent = '🛠️';
          decorElement.style.top = '14px';
          decorElement.style.right = '-4px';
          decorElement.style.fontSize = '0.9rem';
        }
        break;
      case 'cat_ghost':
        catElement.style.filter = 'opacity(0.55) brightness(1.2)';
        if (decorElement) {
          decorElement.textContent = '👻';
          decorElement.style.top = '-8px';
          decorElement.style.fontSize = '1.2rem';
          decorElement.style.opacity = '0.35';
        }
        break;
      case 'cat_wizard':
        if (decorElement) {
          decorElement.textContent = '🧙';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_pirate':
        if (decorElement) {
          decorElement.textContent = '🏴‍☠️';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_knight':
        if (decorElement) {
          decorElement.textContent = '🛡️';
          decorElement.style.bottom = '-4px';
          decorElement.style.left = '-6px';
          decorElement.style.fontSize = '1.2rem';
        }
        break;
      case 'cat_galaxy':
        catElement.style.filter = 'hue-rotate(145deg) saturate(2.8) brightness(1.1)';
        catElement.style.textShadow = '0 0 10px rgba(124, 77, 255, 0.8)';
        break;
      case 'cat_electric':
        if (decorElement) {
          decorElement.textContent = '⚡';
          decorElement.style.top = '-8px';
          decorElement.style.right = '-6px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_ice':
        catElement.style.filter = 'hue-rotate(180deg) saturate(1.5) brightness(1.2)';
        catElement.style.textShadow = '0 0 10px rgba(0, 229, 255, 0.8)';
        if (decorElement) {
          decorElement.textContent = '❄️';
          decorElement.style.top = '-8px';
          decorElement.style.right = '-6px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_fire':
        catElement.style.filter = 'hue-rotate(10deg) saturate(3.5) brightness(1.1)';
        catElement.style.textShadow = '0 0 10px rgba(255, 61, 0, 0.8)';
        if (decorElement) {
          decorElement.textContent = '🔥';
          decorElement.style.top = '-8px';
          decorElement.style.right = '-6px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;

      case 'cat_pumpkin':
        if (decorElement) {
          decorElement.textContent = '🎃';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_santa':
        if (decorElement) {
          decorElement.textContent = '🎅';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_bunny':
        if (decorElement) {
          decorElement.textContent = '🐰';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_valentine':
        if (decorElement) {
          decorElement.textContent = '❤️';
          decorElement.style.top = '-4px';
          decorElement.style.right = '-4px';
          decorElement.style.fontSize = '1.0rem';
        }
        break;
      case 'halloween-ghost':
        catElement.style.filter = 'opacity(0.4) grayscale(1) brightness(1.6)';
        catElement.style.textShadow = '0 0 10px rgba(124, 77, 255, 0.7)';
        if (decorElement) {
          decorElement.textContent = '👻';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'winter-santa':
        if (decorElement) {
          decorElement.textContent = '🎅';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'spring-flower':
        if (decorElement) {
          decorElement.textContent = '🌸';
          decorElement.style.top = '-12px';
          decorElement.style.fontSize = '1.2rem';
        }
        break;
      case 'anniversary-party':
        if (decorElement) {
          decorElement.textContent = '🥳';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_rainbow':
        catElement.classList.add('rainbow-cat-active');
        catElement.style.textShadow = '0 0 12px rgba(255, 23, 68, 0.6)';
        break;

      case 'cat_neon':
        catElement.style.filter = 'hue-rotate(270deg) saturate(4.5)';
        catElement.style.textShadow = '0 0 12px rgba(124, 77, 255, 0.9)';
        break;
      case 'cat_golden':
        catElement.style.filter = 'sepia(1) saturate(5) hue-rotate(15deg) brightness(1.05)';
        catElement.style.textShadow = '0 0 12px rgba(255, 215, 0, 0.9)';
        break;
      case 'cat_crystal':
        catElement.style.filter = 'saturate(0.5) brightness(1.35) hue-rotate(180deg)';
        catElement.style.textShadow = '0 0 12px rgba(0, 229, 255, 0.9)';
        break;
      case 'cat_moon':
        if (decorElement) {
          decorElement.textContent = '🌙';
          decorElement.style.top = '-6px';
          decorElement.style.right = '-6px';
          decorElement.style.fontSize = '1.1rem';
        }
        break;
      case 'cat_sun':
        if (decorElement) {
          decorElement.textContent = '☀️';
          decorElement.style.top = '-6px';
          decorElement.style.right = '-6px';
          decorElement.style.fontSize = '1.1rem';
        }
        break;
      case 'cat_god':
        if (decorElement) {
          decorElement.textContent = '👼';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;

      case 'cat_detective':
        if (decorElement) {
          decorElement.textContent = '🕵️';
          decorElement.style.top = '-14px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_gamer':
        if (decorElement) {
          decorElement.textContent = '🎧';
          decorElement.style.top = '-8px';
          decorElement.style.fontSize = '1.4rem';
          decorElement.style.zIndex = '3';
        }
        break;
      case 'cat_pizza':
        if (decorElement) {
          decorElement.textContent = '🍕';
          decorElement.style.top = '-2px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_fish':
        if (decorElement) {
          decorElement.textContent = '🐟';
          decorElement.style.bottom = '4px';
          decorElement.style.right = '4px';
          decorElement.style.fontSize = '1.1rem';
        }
        break;
      case 'cat_sleepy':
        if (decorElement) {
          decorElement.textContent = '💤';
          decorElement.style.top = '-8px';
          decorElement.style.right = '-4px';
          decorElement.style.fontSize = '1.0rem';
        }
        break;
      case 'cat_scientist':
        if (decorElement) {
          decorElement.textContent = '🥽';
          decorElement.style.top = '14px';
          decorElement.style.fontSize = '1.5rem';
          decorElement.style.zIndex = '3';
        }
        break;
    }

    if (expressionId === 'expr_cool' && exprElement) {
      exprElement.textContent = '🕶️';
      exprElement.style.top = '14px';
      exprElement.style.fontSize = '1.4rem';
      exprElement.style.zIndex = '2';
    } else if (expressionId === 'expr_sleepy' && exprElement) {
      exprElement.textContent = '💤';
      exprElement.style.top = '-4px';
      exprElement.style.right = '-4px';
      exprElement.style.fontSize = '0.9rem';
      exprElement.style.zIndex = '2';
    } else if (expressionId === 'expression-scared' && exprElement) {
      exprElement.textContent = '💦';
      exprElement.style.top = '-8px';
      exprElement.style.right = '-6px';
      exprElement.style.fontSize = '0.9rem';
      exprElement.style.zIndex = '2';
    } else if (expressionId === 'expression-frosty' && exprElement) {
      exprElement.textContent = '❄️';
      exprElement.style.top = '10px';
      exprElement.style.left = '-8px';
      exprElement.style.fontSize = '0.9rem';
      exprElement.style.zIndex = '2';
    } else if (expressionId === 'expression-blossom' && exprElement) {
      exprElement.textContent = '🌸';
      exprElement.style.top = '-4px';
      exprElement.style.right = '-4px';
      exprElement.style.fontSize = '0.8rem';
      exprElement.style.zIndex = '2';
    } else if (expressionId === 'expression-exuberant' && exprElement) {
      exprElement.textContent = '🎉';
      exprElement.style.top = '-6px';
      exprElement.style.left = '-6px';
      exprElement.style.fontSize = '0.9rem';
      exprElement.style.zIndex = '2';
    }
  }

  // ==================== AVATAR MIX-AND-MATCH PROFILE CUSTOMS SYSTEM ====================

  let tempSelectedCat = '';
  let tempSelectedExpression = '';
  let tempSelectedFrame = '';
  let pendingUnlockId = '';
  let pendingUnlockCost = 0;
  let pendingUnlockType = '';

  function renderProfileCustoms(user) {
    if (!user) return;
    const nameEl = document.getElementById('profile-display-name');
    const badgeEl = document.getElementById('profile-badge-element');
    const avatarCatEl = document.getElementById('profile-avatar-cat-element');
    const avatarExprEl = document.getElementById('profile-avatar-expr-element');
    const avatarFrameEl = document.getElementById('profile-avatar-frame-element');
    
    if (nameEl) {
      let displayName = user.displayName || user.email.split('@')[0];
      const isSignedTag = activeCosmetics.includes('signed-nametag');
      if (isSignedTag) {
        displayName = `👑 ${displayName}'s luck`;
      }
      
      if (activeTitle) {
        nameEl.innerHTML = `${escapeHtml(displayName)} <span style="font-size: 0.72rem; vertical-align: middle; background: rgba(124, 77, 255, 0.15); color: var(--color-primary); border: 1.5px solid var(--color-primary); padding: 2px 7px; border-radius: 4px; font-weight: 800; margin-left: 5px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 0 8px rgba(124, 77, 255, 0.3); font-family: var(--font-headings);">${escapeHtml(activeTitle)}</span>`;
      } else {
        nameEl.textContent = displayName;
      }
      
      // Golden Name Glow
      if (activeCosmetics.includes('golden-name')) {
        nameEl.classList.add('gold-glow-active');
      } else {
        nameEl.classList.remove('gold-glow-active');
      }

      // Rainbow Name Anim
      if (activeCosmetics.includes('rainbow-name')) {
        nameEl.classList.add('rainbow-text-active');
      } else {
        nameEl.classList.remove('rainbow-text-active');
      }

      // Signature line underneath name
      let sigEl = document.getElementById('profile-signature-line');
      if (isSignedTag) {
        if (!sigEl) {
          sigEl = document.createElement('div');
          sigEl.id = 'profile-signature-line';
          sigEl.style.cssText = 'font-size: 0.65rem; color: #c084fc; font-style: italic; font-weight: 700; margin-top: 4px; text-shadow: 0 0 8px rgba(168,85,247,0.4);';
          sigEl.textContent = '✍ Signed by Catnip Studios';
          nameEl.parentNode.appendChild(sigEl);
        }
      } else {
        if (sigEl) sigEl.remove();
      }
    }

    if (badgeEl) {
      badgeEl.innerHTML = '';
      const localEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
      const isDevSession = isDeveloperEmail(localEmail);
      if (isDevSession) {
        const staffSpan = document.createElement('span');
        staffSpan.style.cssText = 'background: linear-gradient(135deg, #7C4DFF, #00B0FF); color: #FFF; font-size: 0.62rem; font-weight: 800; padding: 2px 5px; border-radius: 3px; cursor: help; line-height: 1;';
        staffSpan.title = 'Official Catnip Staff Developer';
        staffSpan.textContent = 'STAFF';
        badgeEl.appendChild(staffSpan);

        const ownerSpan = document.createElement('span');
        ownerSpan.style.cssText = 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; font-size: 0.62rem; font-weight: 800; padding: 2px 5px; border-radius: 3px; cursor: help; line-height: 1; margin-left: 3px; border: 1px solid #FFD700; box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);';
        ownerSpan.title = 'Official Owner & Lead Creator';
        ownerSpan.textContent = 'OWNER';
        badgeEl.appendChild(ownerSpan);
      }
      if (activeCosmetics.includes('crown-badge')) {
        const crownSpan = document.createElement('span');
        crownSpan.style.cssText = 'filter: drop-shadow(0 0 4px rgba(255,215,0,0.6)); font-size: 0.95rem;';
        crownSpan.textContent = '👑';
        badgeEl.appendChild(crownSpan);
      }

      // Signed developer badges
      const signedBadges = [
        { id: 'badge_dev_signed', emoji: '✍️' },
        { id: 'badge_dev_star', emoji: '⭐' },
        { id: 'badge_dev_paw', emoji: '🐾' },
        { id: 'badge_dev_pick', label: "💜 DEV'S PICK" }
      ];
      signedBadges.forEach(b => {
        if (activeCosmetics.includes(b.id)) {
          const badgeSpan = document.createElement('span');
          if (b.label) {
            badgeSpan.style.cssText = 'background: rgba(168, 85, 247, 0.2); color: #c084fc; font-size: 0.62rem; font-weight: 800; padding: 2px 5px; border-radius: 4px; border: 1px dashed #a855f7; cursor: help;';
            badgeSpan.textContent = b.label;
          } else {
            badgeSpan.style.cssText = 'font-size: 0.95rem; cursor: help; filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.6));';
            badgeSpan.textContent = b.emoji;
          }
          badgeSpan.title = 'Awarded by Catnip Studios.';
          badgeEl.appendChild(badgeSpan);
        }
      });
    }

    const currentCatObj = catsData.find(c => c.id === avatarCat) || catsData[0];
    const currentExprObj = exprsData.find(e => e.id === avatarExpression) || exprsData[0];
    const currentFrameObj = framesData.find(f => f.id === avatarFrame) || framesData[0];

    const avatarDecorEl = document.getElementById('profile-avatar-decor-element');
    applyAvatarComposite(avatarCat, avatarExpression, avatarCatEl, avatarExprEl, avatarDecorEl);

    if (avatarFrameEl) {
      avatarFrameEl.className = 'profile-avatar-frame';
      avatarFrameEl.classList.add(currentFrameObj.css);
    }

    // Toggle Signed Profile Card
    const signedCard = document.getElementById('profile-signed-card-container');
    const signedCardUser = document.getElementById('profile-signed-card-username');
    if (signedCard) {
      if (activeCosmetics.includes('signed-profilecard')) {
        signedCard.style.display = 'block';
        if (signedCardUser) {
          const rawName = user.displayName || user.email.split('@')[0];
          signedCardUser.textContent = `- ${rawName}`;
        }
      } else {
        signedCard.style.display = 'none';
      }
    }

    const statsGames = document.getElementById('profile-games-played');
    const statsEarned = document.getElementById('profile-total-earned');
    const statsMedals = document.getElementById('profile-achievement-count');
    const statsJoin = document.getElementById('profile-join-date');

    if (statsGames) statsGames.textContent = gamesPlayed;
    if (statsEarned) statsEarned.textContent = totalCoinsEarned;
    if (statsMedals) statsMedals.textContent = achievements.length;
    if (statsJoin) statsJoin.textContent = `Joined: ${joinDate}`;

    const shelf = document.getElementById('profile-achievements-shelf');
    if (shelf) {
      shelf.innerHTML = '';
      const achievementData = {
        first_cat: { name: 'First Cat', emoji: '🥉', desc: 'Create an account. (+50 Coins, "Kitty" Title)' },
        rich_kitty: { name: 'Rich Kitty', emoji: '💰', desc: 'Accumulated 1,000 Catnip Coins. (+200 Coins, "Merchant" Title)' },
        rat_slayer: { name: 'Rat Slayer', emoji: '⚔️', desc: 'Beat 50 brawler enemies in Super Cat World. (+300 Coins, "Slayer" Title)' },
        lore_explorer: { name: 'Lore Explorer', emoji: '📖', desc: 'Read 25 wiki pages. (+150 Coins, "Scholar" Title)' },
        cat_emperor: { name: 'Cat Emperor', emoji: '👑', desc: 'Unlocked all customization items. ("Emperor" Title)' },
        'ach-halloween': { name: 'Spooky Season', emoji: '🎃', desc: 'Unlock any Halloween event item. (+100 Coins, "Gravekeeper" Title)' },
        'ach-winter': { name: 'Winter Wonderland', emoji: '🎄', desc: 'Unlock any Winter event item. (+100 Coins, "Yeti" Title)' },
        'ach-spring': { name: 'Spring Awakening', emoji: '🐣', desc: 'Unlock any Spring event item. (+100 Coins, "Florist" Title)' },
        'ach-anniversary': { name: 'Happy Birthday!', emoji: '🎆', desc: 'Log in during the Anniversary event. (+200 Coins, "Celebrity" Title)' }
      };

      if (achievements.length === 0) {
        shelf.innerHTML = '<span style="font-size: 0.72rem; color: var(--color-text-muted); padding-left: 2px;">No achievements unlocked yet.</span>';
      } else {
        achievements.forEach(id => {
          const item = achievementData[id];
          if (item) {
            const span = document.createElement('span');
            span.className = 'medal-badge';
            span.textContent = item.emoji;
            span.title = `${item.name}: ${item.desc}`;
            shelf.appendChild(span);
          }
        });
      }
    }
  }

  function checkAchievements() {
    let unlockedAny = false;
    let earnedCoins = 0;
    const currentList = [...achievements];

    const addAch = (id, name, emoji, coinReward, titleReward) => {
      if (!currentList.includes(id)) {
        currentList.push(id);
        achievements = currentList;
        unlockedAny = true;

        // Award Achievement XP (100 - 500 XP)
        let xpReward = 100;
        if (coinReward >= 100) xpReward = 500;
        else if (coinReward >= 50) xpReward = 250;
        if (typeof addXP === 'function') addXP(xpReward);
        
        if (coinReward > 0) {
          userCoins += coinReward;
          totalCoinsEarned += coinReward;
          earnedCoins += coinReward;
        }
        
        if (titleReward && !unlockedTitles.includes(titleReward)) {
          unlockedTitles.push(titleReward);
        }
        
        showAchievementToast(name, emoji, coinReward > 0 ? `+${coinReward} Coins, "${titleReward}" Title` : `"${titleReward}" Title`);
        playRetroSound('victory');
      }
    };

    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    let hasAccount = false;
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      hasAccount = true;
    } else if (savedUser) {
      hasAccount = true;
    }

    if (hasAccount) {
      addAch('first_cat', 'First Cat', '🥉', 50, 'Kitty');
    }

    let currentEmail = '';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      currentEmail = firebase.auth().currentUser.email;
    }
    if (!currentEmail && savedUser) {
      currentEmail = savedUser.email;
    }
    const isDev = isDeveloperEmail(currentEmail);

    if (totalCoinsEarned >= 1000 || userCoins >= 1000) {
      addAch('rich_kitty', 'Rich Kitty', '💰', 200, 'Merchant');
    }

    if (ratKillsCount >= 50) {
      addAch('rat_slayer', 'Rat Slayer', '⚔️', 300, 'Slayer');
    }

    if (wikiPagesRead >= 25) {
      addAch('lore_explorer', 'Lore Explorer', '📖', 150, 'Scholar');
    }

    if ((unlockedCats.length >= 38 && unlockedFrames.length >= 11) || isDev) {
      addAch('cat_emperor', 'Cat Emperor', '👑', 0, 'Emperor');
    }

    // Seasonal Event Achievements
    const hasHalloweenItem = ownedItems.includes('halloween-ghost') || ownedItems.includes('halloween-web') || ownedItems.includes('expression-scared');
    if (hasHalloweenItem) {
      addAch('ach-halloween', 'Spooky Season', '🎃', 100, 'Gravekeeper');
    }

    const hasWinterItem = ownedItems.includes('winter-santa') || ownedItems.includes('winter-candy') || ownedItems.includes('expression-frosty');
    if (hasWinterItem) {
      addAch('ach-winter', 'Winter Wonderland', '🎄', 100, 'Yeti');
    }

    const hasSpringItem = ownedItems.includes('spring-flower') || ownedItems.includes('spring-vines') || ownedItems.includes('expression-blossom');
    if (hasSpringItem) {
      addAch('ach-spring', 'Spring Awakening', '🐣', 100, 'Florist');
    }

    if (activeEvent === 'anniversary' && hasAccount) {
      addAch('ach-anniversary', 'Happy Birthday!', '🎆', 200, 'Celebrity');
    }

    if (isDev) {
      if (!unlockedTitles.includes('Staff')) unlockedTitles.push('Staff');
      if (!activeTitle) activeTitle = 'Staff';
    }

    if (unlockedAny) {
      updateCoinUI();
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      if (savedUser) renderProfileCustoms(savedUser);
    }
  }

  function showAchievementToast(name, emoji, desc = '') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: rgba(18, 14, 36, 0.95);
      border: 2.5px solid var(--color-primary);
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(124, 77, 255, 0.5);
      padding: 16px 22px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 15px;
      transform: translateY(150px) scale(0.8);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.innerHTML = `
      <div style="font-size: 2.2rem; filter: drop-shadow(0 0 6px var(--color-primary));">${emoji}</div>
      <div style="text-align: left;">
        <span style="font-size: 0.65rem; color: var(--color-primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; display: block;">Achievement Unlocked!</span>
        <strong style="font-size: 1.05rem; color: #FFF; font-family: var(--font-headings); display: block; margin-top: 1px;">${name}</strong>
        ${desc ? `<span style="font-size: 0.72rem; color: var(--color-text-secondary); display: block; margin-top: 2px;">${desc}</span>` : ''}
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0) scale(1)';
      toast.style.opacity = '1';
    }, 100);

    setTimeout(() => {
      toast.style.transform = 'translateY(150px) scale(0.8)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 4500);
  }

  function renderAvatarCustomizer() {
    const catsGrid = document.getElementById('cats-selection-grid');
    const framesGrid = document.getElementById('frames-selection-grid');
    const exprsGrid = document.getElementById('exprs-selection-grid');

    let currentEmail = '';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      currentEmail = firebase.auth().currentUser.email;
    }
    if (!currentEmail) {
      const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      currentEmail = localUser ? localUser.email : '';
    }
    const isDev = isDeveloperEmail(currentEmail);

    const selectTitle = document.getElementById('avatar-select-title');
    if (selectTitle) {
      selectTitle.innerHTML = '<option value="">None (No Title)</option>';
      unlockedTitles.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        if (title === activeTitle) option.selected = true;
        selectTitle.appendChild(option);
      });
    }

    const updatePreview = () => {
      const editPreviewFrame = document.getElementById('edit-avatar-preview-frame');
      const editPreviewCat = document.getElementById('edit-avatar-preview-cat');
      const editPreviewExpr = document.getElementById('edit-avatar-preview-expr');

      const catObj = catsData.find(c => c.id === tempSelectedCat) || catsData[0];
      const exprObj = exprsData.find(e => e.id === tempSelectedExpression) || exprsData[0];
      const frameObj = framesData.find(f => f.id === tempSelectedFrame) || framesData[0];

      const editPreviewDecor = document.getElementById('edit-avatar-preview-decor');
      applyAvatarComposite(tempSelectedCat, tempSelectedExpression, editPreviewCat, editPreviewExpr, editPreviewDecor);

      if (editPreviewFrame) {
        editPreviewFrame.className = 'profile-avatar-frame';
        editPreviewFrame.classList.add(frameObj.css);
      }
    };

    if (catsGrid) {
      catsGrid.innerHTML = '';
      catsData.forEach(item => {
        const div = document.createElement('div');
        const isOwned = unlockedCats.includes(item.id) || isDev;
        const isActive = tempSelectedCat === item.id;
        
        div.className = `grid-item-option${isActive ? ' active' : ''}${!isOwned ? ' locked' : ''}`;
        div.title = `${item.name}${!isOwned ? ` (Locked - Cost: ${item.cost} 🪙)` : ''}`;
        
        div.innerHTML = `
          <span class="option-emoji">${item.emoji}</span>
          <span class="item-label">${item.name}</span>
        `;

        div.onclick = () => {
          if (isOwned) {
            tempSelectedCat = item.id;
            playRetroSound('click');
            renderAvatarCustomizer();
          } else {
            showUnlockConfirm(item.id, item.cost, 'cat', item.name);
          }
        };
        catsGrid.appendChild(div);
      });
    }

    if (framesGrid) {
      framesGrid.innerHTML = '';
      framesData.forEach(item => {
        const div = document.createElement('div');
        const isOwned = unlockedFrames.includes(item.id) || isDev;
        const isActive = tempSelectedFrame === item.id;
        
        div.className = `grid-item-option${isActive ? ' active' : ''}${!isOwned ? ' locked' : ''}`;
        div.title = `${item.name}${!isOwned ? ` (Locked - Cost: ${item.cost} 🪙)` : ''}`;

        div.innerHTML = `
          <span class="option-emoji">${item.emoji}</span>
          <span class="item-label">${item.name}</span>
        `;

        div.onclick = () => {
          if (isOwned) {
            tempSelectedFrame = item.id;
            playRetroSound('click');
            renderAvatarCustomizer();
          } else {
            showUnlockConfirm(item.id, item.cost, 'frame', item.name);
          }
        };
        framesGrid.appendChild(div);
      });
    }

    if (exprsGrid) {
      exprsGrid.innerHTML = '';
      exprsData.forEach(item => {
        const div = document.createElement('div');
        const isActive = tempSelectedExpression === item.id;
        
        div.className = `grid-item-option${isActive ? ' active' : ''}`;
        div.title = item.name;

        div.innerHTML = `
          <span class="option-emoji">${item.emoji}</span>
          <span class="item-label">${item.name}</span>
        `;

        div.onclick = () => {
          tempSelectedExpression = item.id;
          playRetroSound('click');
          renderAvatarCustomizer();
        };
        exprsGrid.appendChild(div);
      });
    }

    updatePreview();
  }

  function showUnlockConfirm(id, cost, type, name) {
    pendingUnlockId = id;
    pendingUnlockCost = cost;
    pendingUnlockType = type;

    const overlay = document.getElementById('avatar-purchase-confirm');
    const text = document.getElementById('purchase-confirm-text');
    if (overlay && text) {
      text.innerHTML = `Unlock <strong>${name}</strong> for <strong style="color:#FFD700;">${cost} 🪙</strong>?`;
      overlay.style.display = 'block';
      playRetroSound('click');
    }
  }

  function hideUnlockConfirm() {
    const overlay = document.getElementById('avatar-purchase-confirm');
    if (overlay) overlay.style.display = 'none';
    pendingUnlockId = '';
    pendingUnlockCost = 0;
    pendingUnlockType = '';
  }

  // --- Profile Customizer Click Listeners ---
  const editProfileBtn = document.getElementById('btn-edit-profile');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      tempSelectedCat = avatarCat;
      tempSelectedExpression = avatarExpression;
      tempSelectedFrame = avatarFrame;
      hideUnlockConfirm();
      
      const modal = document.getElementById('avatar-edit-modal');
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
      
      const inputName = document.getElementById('avatar-input-name');
      const selectGame = document.getElementById('avatar-select-game');
      const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      if (inputName && savedUser) {
        inputName.value = savedUser.displayName || savedUser.email.split('@')[0];
      }
      if (selectGame) {
        selectGame.value = favouriteGame;
      }
      
      renderAvatarCustomizer();
    });
  }

  const saveAvatarBtn = document.getElementById('btn-save-avatar');
  if (saveAvatarBtn) {
    saveAvatarBtn.addEventListener('click', () => {
      avatarCat = tempSelectedCat;
      avatarExpression = tempSelectedExpression;
      avatarFrame = tempSelectedFrame;
      
      const selectGame = document.getElementById('avatar-select-game');
      if (selectGame) favouriteGame = selectGame.value;

      const selectTitle = document.getElementById('avatar-select-title');
      if (selectTitle) activeTitle = selectTitle.value;

      const inputName = document.getElementById('avatar-input-name');
      const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      if (inputName && savedUser) {
        const newName = inputName.value.trim();
        if (newName) {
          savedUser.displayName = newName;
          localStorage.setItem('scw_local_user', JSON.stringify(savedUser));
        }
      }

      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      renderProfileCustoms(savedUser);
      playRetroSound('purchase');
      
      const modal = document.getElementById('avatar-edit-modal');
      if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  const closeAvatarModal = () => {
    const modal = document.getElementById('avatar-edit-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  const btnCloseAvatar = document.getElementById('btn-close-avatar-modal');
  if (btnCloseAvatar) btnCloseAvatar.addEventListener('click', closeAvatarModal);

  const btnCancelAvatar = document.getElementById('btn-cancel-avatar');
  if (btnCancelAvatar) btnCancelAvatar.addEventListener('click', closeAvatarModal);

  // --- XP System Title Selector Change Handler ---
  const profileTitleSelect = document.getElementById('profile-title-select');
  if (profileTitleSelect) {
    profileTitleSelect.addEventListener('change', (e) => {
      activeTitle = e.target.value;
      localStorage.setItem('scw_active_title', activeTitle);
      
      const selectTitleModal = document.getElementById('avatar-select-title');
      if (selectTitleModal) {
        selectTitleModal.value = activeTitle;
      }
      
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      
      const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      renderProfileCustoms(savedUser);
      updateXPUI();
      playRetroSound('click');
    });
  }

  // --- XP System Prestige Ascension Button Handler ---
  const btnProfilePrestige = document.getElementById('btn-profile-prestige');
  if (btnProfilePrestige) {
    btnProfilePrestige.addEventListener('click', () => {
      if (userLevel < 100) {
        alert("❌ Error: You must reach Level 100 to Prestige!");
        return;
      }
      
      const confirmStr = `⭐ ASCENSION CONFIRMATION ⭐\n\nAre you ready to Prestige? This will:\n1. Reset your level to 1\n2. Reset your XP to 0\n3. Keep ALL of your coins, cosmetics, and achievements\n4. Give you a brand-new Prestige Badge!\n\nDo you wish to ascend?`;
      if (confirm(confirmStr)) {
        userPrestige++;
        userLevel = 1;
        userXP = 0;
        
        const prestigeBadge = getPrestigeBadge(userPrestige);
        alert(`🎉 Congratulations! You have ascended to ${prestigeBadge}! Your level has reset, but your legacy continues!`);
        
        saveCoinsToLocalStorage();
        syncCoinsToFirestore();
        updateXPUI();
        playRetroSound('victory');
      }
    });
  }

  function updateStatsUI() {
    const elHours = document.getElementById('stat-hours-played');
    const elWon = document.getElementById('stat-games-won');
    const elDefeated = document.getElementById('stat-enemies-defeated');
    const elWiki = document.getElementById('stat-wiki-read');
    const elJournal = document.getElementById('stat-journal-streak');
    const elLogin = document.getElementById('stat-login-streak');
    const elSpent = document.getElementById('stat-coins-spent');
    const elEarned = document.getElementById('stat-coins-earned');

    if (elHours) elHours.textContent = `${hoursPlayed} hrs`;
    if (elWon) elWon.textContent = victoryCount;
    if (elDefeated) elDefeated.textContent = ratKillsCount;
    if (elWiki) elWiki.textContent = wikiPagesRead;
    if (elJournal) elJournal.textContent = `${journalStreak} days`;
    if (elLogin) elLogin.textContent = `${loginStreak} days`;
    if (elSpent) elSpent.textContent = coinsSpent;
    if (elEarned) elEarned.textContent = totalCoinsEarned;
  }

  const tabBtns = document.querySelectorAll('#avatar-edit-modal .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'rgba(255,255,255,0.05)';
        b.style.borderColor = 'var(--border-light)';
        b.style.color = 'var(--color-text-secondary)';
      });
      btn.classList.add('active');
      btn.style.background = 'rgba(124, 77, 255, 0.15)';
      btn.style.borderColor = 'var(--color-primary)';
      btn.style.color = '#FFF';

      const tab = btn.getAttribute('data-tab');
      const contents = document.querySelectorAll('#avatar-edit-modal .avatar-tab-content');
      contents.forEach(c => c.style.display = 'none');
      
      const targetContent = document.getElementById('tab-content-' + tab);
      if (targetContent) targetContent.style.display = 'block';
      
      if (tab === 'stats') {
        updateStatsUI();
      }
      
      playRetroSound('click');
    });
  });

  const btnAvatarPurchaseYes = document.getElementById('btn-avatar-purchase-yes');
  if (btnAvatarPurchaseYes) {
    btnAvatarPurchaseYes.addEventListener('click', () => {
      if (userCoins >= pendingUnlockCost) {
        if (deductCoins(pendingUnlockCost)) {
          if (pendingUnlockType === 'cat') {
            unlockedCats.push(pendingUnlockId);
            tempSelectedCat = pendingUnlockId;
          } else if (pendingUnlockType === 'frame') {
            unlockedFrames.push(pendingUnlockId);
            tempSelectedFrame = pendingUnlockId;
          }
          playRetroSound('purchase');
          hideUnlockConfirm();
          renderAvatarCustomizer();
          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
        }
      } else {
        alert("❌ Insufficient Catnip Coins to unlock this avatar element!");
      }
    });
  }

  const btnAvatarPurchaseNo = document.getElementById('btn-avatar-purchase-no');
  if (btnAvatarPurchaseNo) {
    btnAvatarPurchaseNo.addEventListener('click', () => {
      hideUnlockConfirm();
    });
  }

  // Double check profile displays are updated on avatar display click
  const avatarDisplayBox = document.getElementById('profile-avatar-display');
  if (avatarDisplayBox && editProfileBtn) {
    avatarDisplayBox.addEventListener('click', () => {
      editProfileBtn.click();
    });
  }

  // Expose customizations globally
  window.renderProfileCustoms = renderProfileCustoms;
  window.checkAchievements = checkAchievements;

  // Helper to award brawler coins safely with daily rate limits
  function claimBrawlerVictoryReward() {
    const today = new Date().toDateString();
    let dailyClaims = JSON.parse(localStorage.getItem('ssc_daily_claims') || '{"date":"","count":0}');
    if (dailyClaims.date !== today) {
      dailyClaims = { date: today, count: 0 };
    }

    if (dailyClaims.count >= 5) {
      alert("🛡️ Arena Judgement: Daily brawler limit reached! You can claim a maximum of 5 victory rewards (75 Catnip Coins) per day. Check back tomorrow!");
      return;
    }

    // Increment count
    dailyClaims.count++;
    localStorage.setItem('ssc_daily_claims', JSON.stringify(dailyClaims));

    // Increment victory count
    victoryCount++;
    localStorage.setItem('scw_victory_count', victoryCount.toString());

    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    if (savedUser) {
      addCoins(15);
      
      if (typeof saveToLocalProfilesDatabase === 'function') {
        saveToLocalProfilesDatabase(savedUser.displayName, savedUser.email, userCoins, ownedItems);
      }
      
      alert(`🏆 Victory Claimed! +15 Catnip Coins added to your wallet! (Daily battles completed: ${dailyClaims.count}/5)`);
    } else {
      localStorage.setItem('ssc_pending_claim_coins', '15');
      alert("🏆 Victory Recorded! You have +15 Catnip Coins pending from Super Smash Cats! Please Sign In or Create an Account above to claim them.");
      const authModal = document.getElementById('auth-modal');
      if (authModal) {
        authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }
  }

  // Super Smash Cats Mini-Battle Arena (2D Canvas Platformer Brawler)
  function initSmashCatsBrawler() {
    const playBtn = document.getElementById('play-mini-battle-btn');
    const battleModal = document.getElementById('battle-modal');
    const closeBtn = document.getElementById('btn-close-battle-modal');
    const escapeBtn = document.getElementById('btn-battle-escape');
    const finishBtn = document.getElementById('btn-battle-finish');
    const canvas = document.getElementById('battle-canvas');
    const resultOverlay = document.getElementById('battle-result-overlay');
    
    if (!playBtn || !battleModal || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let isGameOver = false;
    let victoryClaimed = false;
    
    // Physics constants
    const GRAVITY = 0.45;
    const HORIZ_FRICTION = 0.82;
    
    // Entity structures
    const player = {
      x: 100,
      y: 150,
      vx: 0,
      vy: 0,
      w: 24,
      h: 24,
      hp: 100,
      maxHp: 100,
      facing: 1, // 1 = right, -1 = left
      isJumping: false,
      lastAttackTime: 0,
      attackActiveTime: 0,
      attackCooldown: 250, // ms
      attackDuration: 120, // ms
      color: '#7C4DFF'
    };
    
    const enemy = {
      x: 370,
      y: 150,
      vx: 0,
      vy: 0,
      w: 24,
      h: 24,
      hp: 100,
      maxHp: 100,
      facing: -1,
      isJumping: false,
      lastAttackTime: 0,
      attackActiveTime: 0,
      attackCooldown: 1000,
      attackDuration: 150,
      color: '#FF5252',
      aiState: 'wander',
      aiTimer: 0,
      icon: '🐭',
      name: 'Miner Rat',
      speed: 1.4
    };
    
    const ratProfiles = [
      { name: "Miner Rat", icon: "🐭", maxHP: 90, speed: 1.5, dmg: 8 },
      { name: "Pirate Rat", icon: "🏴‍☠️", maxHP: 110, speed: 1.8, dmg: 12 },
      { name: "Rat King", icon: "👑", maxHP: 145, speed: 2.1, dmg: 16 }
    ];
    
    // Platforms list
    const platforms = [
      { x: 50, y: 220, w: 400, h: 15, color: '#151025', borderColor: '#7C4DFF' },
      { x: 70, y: 150, w: 120, h: 10, color: '#151025', borderColor: '#00B0FF' },
      { x: 310, y: 150, w: 120, h: 10, color: '#151025', borderColor: '#00B0FF' }
    ];
    
    // Floating damage popup particles array
    let damagePopups = [];
    
    // Keyboard inputs state
    const keys = {
      a: false, d: false, w: false, space: false, j: false,
      ArrowLeft: false, ArrowRight: false, ArrowUp: false
    };
    
    // Synthesizer Audio
    const synthAudio = (type) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        
        if (type === 'jump') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'hit') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'fall') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(80, now + 0.35);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'victory') {
          const notes = [261.63, 329.63, 392.00, 523.25];
          notes.forEach((freq, index) => {
            const oscNote = ctx.createOscillator();
            const gainNote = ctx.createGain();
            oscNote.connect(gainNote);
            gainNote.connect(ctx.destination);
            oscNote.type = 'square';
            oscNote.frequency.setValueAtTime(freq, now + index * 0.09);
            gainNote.gain.setValueAtTime(0.12, now + index * 0.09);
            gainNote.gain.linearRampToValueAtTime(0.01, now + index * 0.09 + 0.15);
            oscNote.start(now + index * 0.09);
            oscNote.stop(now + index * 0.09 + 0.15);
          });
        } else if (type === 'defeat') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(110, now + 0.5);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch (e) {}
    };
    
    // Add floating damage popup particle
    const addDamagePopup = (x, y, text, color) => {
      damagePopups.push({
        x, y, text, color,
        timer: 45, // frames
        vy: -1
      });
    };
    
    // Setup and start brawler
    const startBattle = () => {
      // Increment games played stat
      gamesPlayed++;
      if (typeof incrementQuestProgress === 'function') incrementQuestProgress('smash_play');
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      if (savedUser) {
        renderProfileCustoms(savedUser);
      }

      const selected = ratProfiles[Math.floor(Math.random() * ratProfiles.length)];
      enemy.name = selected.name;
      enemy.icon = selected.icon;
      enemy.maxHp = selected.maxHP;
      enemy.hp = selected.maxHP;
      enemy.speed = selected.speed;
      enemy.baseDmg = selected.dmg;
      
      // Reset positions
      player.x = 100;
      player.y = 80;
      player.vx = 0;
      player.vy = 0;
      player.hp = 100;
      player.attackActiveTime = 0;
      
      enemy.x = 350;
      enemy.y = 80;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.attackActiveTime = 0;
      
      damagePopups = [];
      isGameOver = false;
      victoryClaimed = false;
      
      resultOverlay.style.display = 'none';
      battleModal.style.display = 'flex';
      
      // Stop old loop if any
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // Run brawler rendering/updating frame loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Platform collision resolver
    const checkPlatformCollisions = (ent) => {
      let grounded = false;
      platforms.forEach(plat => {
        if (ent.x + ent.w > plat.x && ent.x < plat.x + plat.w) {
          const feetBefore = ent.y + ent.h - ent.vy;
          const feetNow = ent.y + ent.h;
          if (feetBefore <= plat.y + 2 && feetNow >= plat.y && ent.vy >= 0) {
            ent.y = plat.y - ent.h;
            ent.vy = 0;
            grounded = true;
          }
        }
      });
      ent.isJumping = !grounded;
    };

    // Solid body pushing collisions
    const resolveEntityCollisions = (e1, e2) => {
      if (
        e1.x < e2.x + e2.w &&
        e1.x + e1.w > e2.x &&
        e1.y < e2.y + e2.h &&
        e1.y + e1.h > e2.y
      ) {
        const overlapX = Math.min(e1.x + e1.w - e2.x, e2.x + e2.w - e1.x);
        const overlapY = Math.min(e1.y + e1.h - e2.y, e2.y + e2.h - e1.y);
        if (overlapX < overlapY) {
          if (e1.x + e1.w / 2 < e2.x + e2.w / 2) {
            e1.x -= overlapX / 2;
            e2.x += overlapX / 2;
            e1.vx = -1;
            e2.vx = 1;
          } else {
            e1.x += overlapX / 2;
            e2.x -= overlapX / 2;
            e1.vx = 1;
            e2.vx = -1;
          }
        }
      }
    };
    
    // Attack collision hitbox checks
    const checkAttackHitbox = (attacker, defender, isPlayerAttacker) => {
      const slashRange = 36;
      const attackLeft = attacker.facing === 1 ? attacker.x + attacker.w : attacker.x - slashRange;
      const attackRight = attackLeft + slashRange;
      const attackTop = attacker.y - 4;
      const attackBottom = attacker.y + attacker.h + 4;
      
      if (
        attackRight > defender.x &&
        attackLeft < defender.x + defender.w &&
        attackBottom > defender.y &&
        attackTop < defender.y + defender.h
      ) {
        const dmg = Math.floor(Math.random() * 8) + (isPlayerAttacker ? 9 : attacker.baseDmg - 3);
        defender.hp = Math.max(0, defender.hp - dmg);
        
        defender.vx = attacker.facing * (isPlayerAttacker ? 8.5 : 7.5);
        defender.vy = -3.2;
        
        addDamagePopup(defender.x + 10, defender.y - 12, `-${dmg}`, isPlayerAttacker ? '#FFD700' : '#FF5252');
        synthAudio('hit');
        
        if (defender.hp <= 0) {
          endBattle(isPlayerAttacker);
        }
        return true;
      }
      return false;
    };
    
    // Update frames
    const updateGame = () => {
      if (isGameOver) return;
      
      // --- PLAYER MOVEMENT ---
      let runSpeed = 2.4;
      if (keys.a || keys.ArrowLeft) {
        player.vx = -runSpeed;
        player.facing = -1;
      } else if (keys.d || keys.ArrowRight) {
        player.vx = runSpeed;
        player.facing = 1;
      } else {
        player.vx *= HORIZ_FRICTION;
      }
      
      if ((keys.w || keys.space || keys.ArrowUp) && !player.isJumping) {
        player.vy = -7.8;
        player.isJumping = true;
        synthAudio('jump');
        if (typeof incrementQuestProgress === 'function') incrementQuestProgress('smash_jumps');
      }
      
      if (keys.j) {
        const now = Date.now();
        if (now - player.lastAttackTime > player.attackCooldown) {
          player.lastAttackTime = now;
          player.attackActiveTime = player.attackDuration;
          checkAttackHitbox(player, enemy, true);
          if (typeof incrementQuestProgress === 'function') incrementQuestProgress('smash_attacks');
        }
      }
      
      player.vy += GRAVITY;
      player.x += player.vx;
      player.y += player.vy;
      checkPlatformCollisions(player);
      
      if (player.attackActiveTime > 0) {
        player.attackActiveTime -= 16.67;
      }
      
      if (player.y > 300) {
        player.x = 100;
        player.y = 80;
        player.vx = 0;
        player.vy = 0;
        player.hp = Math.max(0, player.hp - 20);
        synthAudio('fall');
        addDamagePopup(100, 100, "-20 FALL!", '#FF5252');
        if (player.hp <= 0) endBattle(false);
      }
      
      // --- ENEMY AI BEHAVIOR ---
      enemy.aiTimer--;
      if (enemy.aiTimer <= 0) {
        const dist = Math.abs(player.x - enemy.x);
        if (dist < 160) {
          enemy.aiState = 'chase';
          enemy.aiTimer = 60 + Math.random() * 40;
        } else {
          enemy.aiState = 'wander';
          enemy.aiTargetX = enemy.x + (Math.random() * 160 - 80);
          enemy.aiTimer = 90 + Math.random() * 90;
        }
      }
      
      if (enemy.aiState === 'chase') {
        if (enemy.x < player.x - 8) {
          enemy.vx = enemy.speed;
          enemy.facing = 1;
        } else if (enemy.x > player.x + 8) {
          enemy.vx = -enemy.speed;
          enemy.facing = -1;
        } else {
          enemy.vx *= HORIZ_FRICTION;
        }
        
        const distToPlayer = Math.sqrt((player.x - enemy.x)**2 + (player.y - enemy.y)**2);
        if (distToPlayer < 35) {
          const now = Date.now();
          if (now - enemy.lastAttackTime > enemy.attackCooldown) {
            enemy.lastAttackTime = now;
            enemy.attackActiveTime = enemy.attackDuration;
            checkAttackHitbox(enemy, player, false);
          }
        }
      } else {
        if (Math.abs(enemy.x - enemy.aiTargetX) > 10) {
          if (enemy.x < enemy.aiTargetX) {
            enemy.vx = enemy.speed * 0.6;
            enemy.facing = 1;
          } else {
            enemy.vx = -enemy.speed * 0.6;
            enemy.facing = -1;
          }
        } else {
          enemy.vx *= HORIZ_FRICTION;
        }
      }
      
      if (enemy.vx !== 0 && enemy.isJumping === false && Math.random() < 0.02) {
        const checkAheadX = enemy.x + enemy.vx * 15;
        let platformAhead = false;
        platforms.forEach(plat => {
          if (checkAheadX >= plat.x && checkAheadX <= plat.x + plat.w) {
            platformAhead = true;
          }
        });
        if (!platformAhead || enemy.x < 65 || enemy.x > 415) {
          enemy.vy = -7.5;
          enemy.isJumping = true;
        }
      }
      
      enemy.vy += GRAVITY;
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;
      checkPlatformCollisions(enemy);
      
      if (enemy.attackActiveTime > 0) {
        enemy.attackActiveTime -= 16.67;
      }
      
      if (enemy.y > 300) {
        enemy.x = 350;
        enemy.y = 80;
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.hp = Math.max(0, enemy.hp - 20);
        synthAudio('fall');
        addDamagePopup(350, 100, "-20 FALL!", '#FFD700');
        if (enemy.hp <= 0) endBattle(true);
      }

      // Resolve solid body overlap collisions between entities
      resolveEntityCollisions(player, enemy);
      
      damagePopups.forEach(pop => {
        pop.y += pop.vy;
        pop.timer--;
      });
      damagePopups = damagePopups.filter(pop => pop.timer > 0);
    };
    
    // Draw frames
    const renderGame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 25) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }
      
      platforms.forEach(plat => {
        ctx.fillStyle = plat.color;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        
        ctx.strokeStyle = plat.borderColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      });
      
      // Draw solid player hitbox
      ctx.fillStyle = 'rgba(124, 77, 255, 0.22)';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.strokeStyle = '#7C4DFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(player.x, player.y, player.w, player.h);

      ctx.font = '20px serif';
      ctx.fillText('🐱', player.x + 2, player.y + 19);
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(player.x - 8, player.y - 12, 40, 5);
      ctx.fillStyle = player.hp > 30 ? '#00E676' : '#FF5252';
      ctx.fillRect(player.x - 8, player.y - 12, (player.hp / player.maxHp) * 40, 5);
      
      // Draw solid enemy hitbox
      ctx.fillStyle = 'rgba(255, 82, 82, 0.22)';
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.strokeStyle = '#FF5252';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);

      ctx.fillText(enemy.icon, enemy.x + 2, enemy.y + 19);
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(enemy.x - 8, enemy.y - 12, 40, 5);
      ctx.fillStyle = '#FF5252';
      ctx.fillRect(enemy.x - 8, enemy.y - 12, (enemy.hp / enemy.maxHp) * 40, 5);
      
      // Draw attack range solid bounds when active
      if (player.attackActiveTime > 0) {
        const slashRange = 36;
        const attackLeft = player.facing === 1 ? player.x + player.w : player.x - slashRange;
        ctx.fillStyle = 'rgba(0, 176, 255, 0.2)';
        ctx.fillRect(attackLeft, player.y - 4, slashRange, player.h + 8);
        ctx.strokeStyle = '#00B0FF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(attackLeft, player.y - 4, slashRange, player.h + 8);
      }
      
      if (enemy.attackActiveTime > 0) {
        const slashRange = 36;
        const attackLeft = enemy.facing === 1 ? enemy.x + enemy.w : enemy.x - slashRange;
        ctx.fillStyle = 'rgba(255, 82, 82, 0.2)';
        ctx.fillRect(attackLeft, enemy.y - 4, slashRange, enemy.h + 8);
        ctx.strokeStyle = '#FF5252';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(attackLeft, enemy.y - 4, slashRange, enemy.h + 8);
      }
      
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      damagePopups.forEach(pop => {
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, pop.x, pop.y);
      });
      ctx.textAlign = 'left';
    };
    
    const gameLoop = () => {
      if (isGameOver) return;
      updateGame();
      renderGame();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    const endBattle = (victory) => {
      isGameOver = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      const overlayIcon = document.getElementById('battle-result-icon');
      const overlayTitle = document.getElementById('battle-result-title');
      const overlayDesc = document.getElementById('battle-result-desc');
      
      if (victory) {
        synthAudio('victory');
        overlayIcon.textContent = "🏆";
        overlayTitle.textContent = "VICTORY";
        overlayTitle.style.color = "#FFD700";
        overlayDesc.innerHTML = `You defeated the ${enemy.name} and saved the day!<br><span style="font-size: 1.5rem; font-weight: 800; color: #00E676; display: block; margin: 10px 0;">+15 Catnip Coins</span>`;
        victoryClaimed = true;

        // Award XP
        if (enemy.name === 'Rat King') {
          if (typeof addXP === 'function') addXP(150);
        } else {
          if (typeof addXP === 'function') addXP(75);
        }

        // Save stats
        ratKillsCount++;
        localStorage.setItem('scw_rat_kills_count', ratKillsCount.toString());
        if (typeof updateStatsUI === 'function') updateStatsUI();

        // Increment quests
        if (typeof incrementQuestProgress === 'function') {
          incrementQuestProgress('smash_rats');
          incrementQuestProgress('smash_win');
          
          if (enemy.name === 'Rat King') {
            incrementQuestProgress('smash_boss');
          }
          
          // Defeated bosses today rare quest tracking
          try {
            let defeatedBosses = JSON.parse(localStorage.getItem('ssc_defeated_bosses_today') || '[]');
            if (!defeatedBosses.includes(enemy.name)) {
              defeatedBosses.push(enemy.name);
              localStorage.setItem('ssc_defeated_bosses_today', JSON.stringify(defeatedBosses));
              incrementQuestProgress('smash_boss_all');
            }
          } catch(e) {}
        }
      } else {
        synthAudio('defeat');
        overlayIcon.textContent = "💀";
        overlayTitle.textContent = "DEFEATED";
        overlayTitle.style.color = "#FF5252";
        overlayDesc.innerHTML = `You were knocked out by the ${enemy.name}!<br><br><span style="color: var(--color-text-secondary);">Practice your moves and try again to win Catnip Coins!</span>`;
        victoryClaimed = false;
      }
      
      resultOverlay.style.display = 'flex';
    };
    
    const closeBattle = () => {
      isGameOver = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      battleModal.style.display = 'none';
    };
    
    const handleKeyDown = (e) => {
      if (battleModal.style.display !== 'flex') return;
      
      const blocked = ['Space', 'KeyW', 'KeyA', 'KeyD', 'KeyJ', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
      if (blocked.includes(e.code) || blocked.includes(e.key)) {
        e.preventDefault();
      }
      
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') keys.a = true;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') keys.d = true;
      if (e.code === 'KeyW' || e.key === 'ArrowUp') keys.w = true;
      if (e.code === 'Space') keys.space = true;
      if (e.code === 'KeyJ') keys.j = true;
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'KeyA' || e.key === 'ArrowLeft') keys.a = false;
      if (e.code === 'KeyD' || e.key === 'ArrowRight') keys.d = false;
      if (e.code === 'KeyW' || e.key === 'ArrowUp') keys.w = false;
      if (e.code === 'Space') keys.space = false;
      if (e.code === 'KeyJ') keys.j = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    window.startSmashCatsBattle = startBattle;
    playBtn.addEventListener('click', startBattle);
    closeBtn.addEventListener('click', closeBattle);
    escapeBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to flee the arena?")) {
        closeBattle();
      }
    });
    
    finishBtn.addEventListener('click', () => {
      closeBattle();
      if (victoryClaimed) {
        claimBrawlerVictoryReward();
      }
    });
  }

  // Initialize brawler
  initSmashCatsBrawler();

  renderStressJournal();

});
