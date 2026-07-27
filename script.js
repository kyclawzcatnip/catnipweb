/**
 * Catnip Studios Web and Wiki
 * Client-Side JavaScript Logic
 */

window.onerror = function(message, source, lineno, colno, error) {
  alert("JavaScript Exception: " + message + " (Line " + lineno + ", Col " + colno + ")");
  return false;
};

document.addEventListener('DOMContentLoaded', () => {

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
    { id: 'cat_scientist', emoji: '🥽', name: 'Scientist Cat', type: 'funny', cost: 120 }
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
    { id: 'frame_floating_stars', emoji: '⭐', name: 'Stars (Anim)', cost: 250, css: 'frame-floating-stars' }
  ];

  const exprsData = [
    { id: 'expr_happy', emoji: '😀', name: 'Happy' },
    { id: 'expr_cool', emoji: '😎', name: 'Cool' },
    { id: 'expr_excited', emoji: '😺', name: 'Excited' },
    { id: 'expr_sleepy', emoji: '😴', name: 'Sleepy' },
    { id: 'expr_confident', emoji: '😼', name: 'Confident' },
    { id: 'expr_angry', emoji: '😾', name: 'Angry' },
    { id: 'expr_surprised', emoji: '😮', name: 'Surprised' },
    { id: 'expr_laughing', emoji: '😂', name: 'Laughing' }
  ];

  // ==================== WIKI ARTICLES DATA ====================
  const wikiArticles = {
    'super-cat-world': {
      title: 'Super Cat World',
      category: 'games',
      tag: 'Game',
      content: `
        <p><strong>Super Cat World</strong> is Catnip Studios' first game and platformer. The game centers around high-performance parkour platforming and challenging boss fights.</p>
        <h4>Game Details</h4>
        <p>Take control of your character and navigate complex 2D levels designed to test your reflexes and skill while preparing for epic boss showdowns.</p>
      `
    },
    'characters': {
      title: 'Characters',
      category: 'characters',
      tag: 'Character',
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
      content: `
        <p>All action in the game takes place in <strong>the world of catz</strong>, a custom-designed universe full of parkour structures, hazards, and enemy territories.</p>
      `
    },
    'items-power-ups': {
      title: 'Items & Power-ups',
      category: 'items',
      tag: 'Item',
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
      content: `
        <p class="text-italic">"When the Rat King's ground fortress fell, his chief naval commander, Pirate Captain Rattail, refused to surrender. Gathering the remaining royal treasures, he fled to the sky islands. There, using floating lumber and sky sails, he constructed an armada of massive wooden warships. He began raiding the trade routes, hoarding thousands of golden sky coins on his vessels. Safe in the clouds, he believed no land-dwelling cat could ever reach his airborne treasury or breach his fleet."</p>
        <h4>Lore & Meaning</h4>
        <p>Introduces the second major antagonist, Pirate Captain Rattail. Following the fall of the land fortress, Rattail constructed an armada of floating sky ships to hoard the kingdom's sky coins out of reach of land-dwelling cats.</p>
        <p><strong>Unlock Location:</strong> World 7 (Level 6)</p>
      `
    },
    'lore-book-5': {
      title: 'Book V: The Sky Captain\'s Vow',
      category: 'lore',
      tag: 'Lore Book',
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
      content: `
        <p class="text-italic">"Beneath the roots of the world lies a network of ancient caves, glowing with giant luminous crystals and flowing rivers of boiling magma. Feline miners once gathered rare gems here, but the heat grew too intense as volcanic fissures opened. The texts warn that the deep caverns are completely impassable without magical protection. Only a hero wearing the Fire Protector aura can walk through the ash storms, withstand the magma hazards, and survive the scorching subterranean beasts."</p>
        <h4>Lore & Meaning</h4>
        <p>Explores the volcanic subterranean biome beneath the World of Catz. It warns of rivers of magma and highlights the necessity of equipping the <strong>Fire Protector</strong> power-up to traverse hot magma zones unharmed.</p>
        <p><strong>Unlock Location:</strong> World 13 (Level 12)</p>
      `
    },
    'lore-book-7': {
      title: 'Book VII: The Miner\'s Greed',
      category: 'lore',
      tag: 'Lore Book',
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

  // ==================== SPA NAVIGATION SYSTEM ====================
  
  // Navigate to target section
  function navigateTo(sectionId) {
    // Check if section is secrets and if authorized
    if (sectionId === 'secrets') {
      const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
      const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
      const isDevSession = localEmail === 'kyclawzcatnip@gmail.com' || localEmail === 'catnip' || localEmail === 'admin';
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
    const validSections = ['home', 'games', 'wiki', 'news', 'stress', 'shop', 'community', 'secrets'];
    if (validSections.includes(hash)) {
      navigateTo(hash);
    }
  });

  // Catch dynamic internal nav trigger clicks
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.nav-trigger');
    if (trigger) {
      e.preventDefault();
      const target = trigger.getAttribute('data-target');
      window.location.hash = target;
      if (typeof playRetroSound === 'function') {
        playRetroSound('click');
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
    const isDevSession = localEmail === 'kyclawzcatnip@gmail.com' || localEmail === 'catnip' || localEmail === 'admin';

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
      // Injects details inside the modal body
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
  const leaderboardTable = document.getElementById('leaderboard-table');
  const leaderboardTbody = document.getElementById('leaderboard-tbody');
  const leaderboardEmptyState = document.getElementById('leaderboard-empty-state');

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
        db.collection('leaderboard').orderBy('time', 'asc').limit(50).onSnapshot((snapshot) => {
          const cloudScores = [];
          snapshot.forEach((doc) => {
            cloudScores.push(doc.data());
          });
          
          // Filter duplicates: keep only the fastest run per unique username
          const uniqueCloud = {};
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
      const isDevSession = localEmail === 'kyclawzcatnip@gmail.com' || localEmail === 'catnip' || localEmail === 'admin';
      if (isDevSession) {
        unlockDevPortalUI();
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
          
          const isDev = savedUser.email && (savedUser.email.toLowerCase() === 'kyclawzcatnip@gmail.com' || savedUser.email.toLowerCase() === 'catnip' || savedUser.email.toLowerCase() === 'admin');
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
            if (email.toLowerCase() === 'kyclawzcatnip@gmail.com' || email.toLowerCase() === 'catnip' || email.toLowerCase() === 'admin') {
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
        if (email.toLowerCase() === 'kyclawzcatnip@gmail.com' || email.toLowerCase() === 'catnip' || email.toLowerCase() === 'admin') {
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
      const isDev = savedUser.email && (savedUser.email.toLowerCase() === 'kyclawzcatnip@gmail.com' || savedUser.email.toLowerCase() === 'catnip' || savedUser.email.toLowerCase() === 'admin');
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
      achievements: achievements
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
      totalCoinsEarned = parseInt(localStorage.getItem('scw_total_coins_earned') || '0', 10);
      gamesPlayed = parseInt(localStorage.getItem('scw_games_played') || '0', 10);
      victoryCount = parseInt(localStorage.getItem('scw_victory_count') || '0', 10);
      favouriteGame = localStorage.getItem('scw_favourite_game') || 'Super Smash Cats';
      achievements = JSON.parse(localStorage.getItem('scw_achievements') || '[]');
      
      updateCoinUI();
      applyActiveCosmetics();
      renderShopItems();
      updateChestUI();
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
          achievements: achievements
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

  // Check / Update Daily Chest UI and state
  function updateChestUI() {
    const btnClaim = document.getElementById('btn-claim-daily');
    const chestEmoji = document.getElementById('chest-emoji');
    const chestInst = document.getElementById('chest-instruction');
    const chestClicker = document.getElementById('daily-chest-clicker');
    if (!btnClaim) return;

    const cooldown = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const timePassed = now - lastClaimTimestamp;

    if (timePassed < cooldown) {
      // Cooldown active
      const timeLeft = cooldown - timePassed;
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minsLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      btnClaim.textContent = `Claimed (${hoursLeft}h ${minsLeft}m left)`;
      btnClaim.disabled = true;
      btnClaim.style.opacity = '0.5';
      if (chestEmoji) chestEmoji.textContent = '🔓';
      if (chestInst) chestInst.textContent = "Your daily chest has been opened! Check back tomorrow for another daily claim.";
      if (chestClicker) chestClicker.style.pointerEvents = 'none';
    } else {
      // Ready to claim
      btnClaim.textContent = 'Claim Free Coins';
      btnClaim.disabled = false;
      btnClaim.style.opacity = '1';
      if (chestEmoji) chestEmoji.textContent = '📦';
      if (chestInst) chestInst.textContent = "Click the chest to claim your daily rewards! (Cooldown: 24 hours)";
      if (chestClicker) chestClicker.style.pointerEvents = 'auto';
    }
  }

  // Claim Daily Chest Handler
  function claimDailyChest(element) {
    const cooldown = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - lastClaimTimestamp >= cooldown) {
      lastClaimTimestamp = now;
      playRetroSound('chest');
      addCoins(50, element);
      
      const chestEmoji = document.getElementById('chest-emoji');
      if (chestEmoji) {
        chestEmoji.textContent = '🔓';
        chestEmoji.style.transform = 'scale(1.4) rotate(8deg)';
        setTimeout(() => {
          chestEmoji.style.transform = '';
        }, 300);
      }

      updateChestUI();
      alert("🎉 You successfully claimed your Daily Chest and received 50 Catnip Coins!");
    }
  }

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
          saveCoinsToLocalStorage();
          syncCoinsToFirestore();
          applyActiveCosmetics();
          renderShopItems();
          alert(`🎉 Congratulations! You have successfully unlocked the ${itemId.replace('-', ' ')} item!`);
        }
      } else {
        alert("❌ Insufficient Catnip Coins! Explore the wiki or check back tomorrow for your daily claim to get more coins.");
      }
    }
  }

  // Attach Daily chest clickers
  const chestClicker = document.getElementById('daily-chest-clicker');
  const btnClaimChest = document.getElementById('btn-claim-daily');
  if (chestClicker) {
    chestClicker.addEventListener('click', () => claimDailyChest(chestClicker));
  }
  if (btnClaimChest) {
    btnClaimChest.addEventListener('click', () => claimDailyChest(chestClicker));
  }

  // Attach Item shop buy button click listeners
  document.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.btn-buy-item');
    if (buyBtn) {
      const itemId = buyBtn.getAttribute('data-item-id');
      const cost = parseInt(buyBtn.getAttribute('data-cost') || '0', 10);
      handleShopItemInteraction(itemId, cost, buyBtn);
    }
  });

  // Track Daily Chest Cooldown periodically
  setInterval(updateChestUI, 30000); // refresh chest timer every 30s

  // Initial load
  loadCoinsFromLocalStorage();

  // Load and query user directory (for Dev secrets accounts viewer)
  function loadUserDirectory() {
    const tbody = document.getElementById('user-directory-tbody');
    if (!tbody) return;

    // We build a collection of active accounts to show
    let userProfiles = [];

    // Fetch current local storage user profile safely
    const localUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    const localEmail = (localUser && typeof localUser.email === 'string') ? localUser.email.toLowerCase() : '';
    const isDevSession = localEmail === 'kyclawzcatnip@gmail.com' || localEmail === 'catnip' || localEmail === 'admin';

    // 1. Add static mock accounts for flavor
    userProfiles.push({
      uid: "mock_dev",
      username: isDevSession ? `${localUser.displayName || localEmail} (Dev)` : "catnip (Dev)",
      email: isDevSession ? localEmail : "kyclawzcatnip@gmail.com",
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
        } else if (activeGameType === 'scw') {
          // Increment customization stats
          gamesPlayed++;
          localStorage.setItem('scw_games_played', gamesPlayed.toString());
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
        default: baseEmoji = '🐱'; break;
      }
    }

    catElement.textContent = baseEmoji;

    catElement.style.filter = 'none';
    catElement.style.textShadow = 'none';
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
          decorElement.style.top = '-18px';
          decorElement.style.fontSize = '1.4rem';
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
          decorElement.style.top = '-12px';
          decorElement.style.fontSize = '1.4rem';
        }
        break;
      case 'cat_santa':
        if (decorElement) {
          decorElement.textContent = '🎅';
          decorElement.style.top = '-16px';
          decorElement.style.fontSize = '1.3rem';
        }
        break;
      case 'cat_bunny':
        if (decorElement) {
          decorElement.textContent = '🐰';
          decorElement.style.top = '-16px';
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
      case 'cat_rainbow':
        catElement.style.filter = 'saturate(3) hue-rotate(45deg)';
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
          decorElement.style.top = '-16px';
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
          decorElement.style.top = '6px';
          decorElement.style.fontSize = '1.9rem';
          decorElement.style.zIndex = '3';
        }
        break;
      case 'cat_pizza':
        if (decorElement) {
          decorElement.textContent = '🍕';
          decorElement.style.bottom = '-4px';
          decorElement.style.right = '-4px';
          decorElement.style.fontSize = '1.1rem';
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
      if (activeCosmetics.includes('golden-name')) {
        nameEl.classList.add('gold-glow-active');
      } else {
        nameEl.classList.remove('gold-glow-active');
      }
    }

    if (badgeEl) {
      badgeEl.innerHTML = '';
      const localEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
      const isDevSession = localEmail === 'kyclawzcatnip@gmail.com' || localEmail === 'catnip' || localEmail === 'admin';
      if (isDevSession) {
        const staffSpan = document.createElement('span');
        staffSpan.style.cssText = 'background: linear-gradient(135deg, #7C4DFF, #00B0FF); color: #FFF; font-size: 0.62rem; font-weight: 800; padding: 2px 5px; border-radius: 3px; cursor: help; line-height: 1;';
        staffSpan.title = 'Official Catnip Staff Developer';
        staffSpan.textContent = 'STAFF';
        badgeEl.appendChild(staffSpan);
      }
      if (activeCosmetics.includes('crown-badge')) {
        const crownSpan = document.createElement('span');
        crownSpan.style.cssText = 'filter: drop-shadow(0 0 4px rgba(255,215,0,0.6)); font-size: 0.95rem;';
        crownSpan.textContent = '👑';
        badgeEl.appendChild(crownSpan);
      }
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
        welcome_kitty: { name: 'Welcome Kitty', emoji: '🐱', desc: 'Welcome! Logged in or created your account' },
        first_victory: { name: 'First Victory', emoji: '🏅', desc: 'Won a game of Smash Cats or survived Among Us' },
        mega_rich: { name: 'Mega Rich', emoji: '👑', desc: 'Accumulated 1,000 or more Catnip Coins' },
        codex_master: { name: 'Codex Master', emoji: '📚', desc: 'Explored all 9 wiki codex articles' },
        daily_logger: { name: 'Daily Logger', emoji: '✍️', desc: 'Submitted a daily journal note entry' },
        lobby_legend: { name: 'Lobby Legend', emoji: '🚀', desc: 'Won Cats Among Us in a massive 30-cat lobby' },
        brawler_master: { name: 'Brawler Master', emoji: '🥊', desc: 'Defeated brawler enemies 5 times' }
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
    const currentList = [...achievements];

    const addAch = (id, name, emoji) => {
      if (!currentList.includes(id)) {
        currentList.push(id);
        achievements = currentList;
        unlockedAny = true;
        showAchievementToast(name, emoji);
        playRetroSound('victory');
      }
    };

    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    if (savedUser) {
      addAch('welcome_kitty', 'Welcome Kitty', '🐱');
    }

    if (userCoins >= 1000) {
      addAch('mega_rich', 'Mega Rich', '👑');
    }

    let readArticles = [];
    try {
      readArticles = JSON.parse(localStorage.getItem('scw_read_articles') || '[]');
    } catch(e) {}
    if (readArticles.length >= 9) {
      addAch('codex_master', 'Codex Master', '📚');
    }

    const username = savedUser ? (savedUser.displayName || savedUser.email.split('@')[0] || '') : '';
    if (username) {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem('scw_journal_history_' + username.toLowerCase()) || '[]');
      } catch(e) {}
      if (history.length > 0) {
        addAch('daily_logger', 'Daily Logger', '✍️');
      }
    }

    if (victoryCount >= 1) {
      addAch('first_victory', 'First Victory', '🏅');
    }

    if (victoryCount >= 5) {
      addAch('brawler_master', 'Brawler Master', '🥊');
    }

    const maxLobbyCats = parseInt(localStorage.getItem('scw_max_lobby_cats') || '0', 10);
    if (maxLobbyCats >= 29) {
      addAch('lobby_legend', 'Lobby Legend', '🚀');
    }

    if (unlockedAny) {
      saveCoinsToLocalStorage();
      syncCoinsToFirestore();
      renderProfileCustoms(savedUser);
    }
  }

  function showAchievementToast(name, emoji) {
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
        const isOwned = unlockedCats.includes(item.id);
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
        const isOwned = unlockedFrames.includes(item.id);
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
      }
      
      if (keys.j) {
        const now = Date.now();
        if (now - player.lastAttackTime > player.attackCooldown) {
          player.lastAttackTime = now;
          player.attackActiveTime = player.attackDuration;
          checkAttackHitbox(player, enemy, true);
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
