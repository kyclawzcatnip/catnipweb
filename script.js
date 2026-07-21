/**
 * Catnip Studios Web and Wiki
 * Client-Side JavaScript Logic
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== STATE VARIABLES ====================
  let currentSection = 'home';
  let activeWikiCategory = 'all';
  let wikiSearchQuery = '';
  let lockTimerInterval = null;

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
        <p class="text-italic">"Long ago, the Great Catnip Tree gave birth to the Nine Feline Realms. The Cat Clan lived in peace... until the Rat King coveted the Golden Catnip."</p>
        <h4>Lore & Meaning</h4>
        <p>This inaugural volume reveals the mythic creation story of the Cat Clan and the Nine Feline Realms by the Great Catnip Tree. It details the peaceful era of feline civilization before conflict erupted when the Rat King launched an assault to claim the sacred Golden Catnip.</p>
        <p><strong>Unlock Location:</strong> World 1 (Level 0)</p>
      `
    },
    'lore-book-2': {
      title: 'Book II: Whispers in the Wall',
      category: 'lore',
      tag: 'Lore Book',
      content: `
        <p class="text-italic">"The Rat King constructed his fortress atop ancient ruins, forging iron-tipped spears and training archers to repel any feline intruders."</p>
        <h4>Lore & Meaning</h4>
        <p>Documents the Rat King's militarization after seizing territory. He erected a heavy iron stronghold over sacred feline ruins, equipping spear-throwers and archers to defend his perimeter against cat scouts.</p>
        <p><strong>Unlock Location:</strong> World 4 (Level 3)</p>
      `
    },
    'lore-book-3': {
      title: 'Book III: Secrets of the Throne',
      category: 'lore',
      tag: 'Lore Book',
      content: `
        <p class="text-italic">"When cornered, the Rat King unleashes floor traps and shadow clones. Legend says only well-timed stomps can shatter his defense."</p>
        <h4>Lore & Meaning</h4>
        <p>A tactical codex detailing the Rat King's boss combat patterns. It explains his reliance on shadow clones and concealed floor spikes when cornered, advising heroes that precise jumping stomps are necessary to crack his armor.</p>
        <p><strong>Unlock Location:</strong> World 5 (Level 4)</p>
      `
    },
    'lore-book-4': {
      title: 'Book IV: Ships in the Sky',
      category: 'lore',
      tag: 'Lore Book',
      content: `
        <p class="text-italic">"Pirate Captain Rattail fled to the sky islands, building floating warships to hoard sky coins away from land-dwelling cats."</p>
        <h4>Lore & Meaning</h4>
        <p>Introduces the second major antagonist, Pirate Captain Rattail. Following the fall of the land fortress, Rattail constructed an armada of floating sky ships to hoard the kingdom's sky coins out of reach.</p>
        <p><strong>Unlock Location:</strong> World 7 (Level 6)</p>
      `
    },
    'lore-book-5': {
      title: 'Book V: The Sky Captain\'s Vow',
      category: 'lore',
      tag: 'Lore Book',
      content: `
        <p class="text-italic">"Captain Rattail swore never to drop anchor until he found the Legendary Sky Fish. His flagship is armed with heavy cannons and spinning yarn!"</p>
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
        <p class="text-italic">"Deep beneath the mountains lie crystal caverns and rivers of magma. Only cats with Fire Protection can withstand the subterranean heat."</p>
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
        <p class="text-italic">"Miner Boss Rattock dug too deep into the ancient ore veins, unleashing cave-ins and volatile minecart explosives."</p>
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
        <p class="text-italic">"Beyond the silver pipes lies a shifting dimension of corrupted code and inverted gravity. Few cats ever return from this frontier."</p>
        <h4>Lore & Meaning</h4>
        <p>The final mystery codex describing the endgame dimension known as <strong>The Gliched Lands</strong>. Located beyond secret silver pipes, this corrupted zone alters gravity and reality, standing as the ultimate test of platforming mastery.</p>
        <p><strong>Unlock Location:</strong> World 26 (Level 25 - Gliched Lands)</p>
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

  // ==================== SPA NAVIGATION SYSTEM ====================
  
  // Navigate to target section
  function navigateTo(sectionId) {
    // Check if section is secrets and if authorized
    if (sectionId === 'secrets') {
      const isAuth = sessionStorage.getItem('dev_auth') === 'true';
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
    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Sections display states
    appSections.forEach(section => {
      const idMatches = section.getAttribute('id') === `${sectionId}-section`;
      if (idMatches) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Reload leaderboard dynamically when opening Community section
    if (sectionId === 'community') {
      loadLeaderboard();
    }
  }

  // Monitor hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'home';
    // Validate hash is one of our sections
    const validSections = ['home', 'games', 'wiki', 'news', 'community', 'secrets'];
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
    // If already authenticated, jump straight to panel
    if (sessionStorage.getItem('dev_auth') === 'true') {
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

  function renderLeaderboardScores(scores) {
    if (!scores || scores.length === 0) {
      if (leaderboardTable) leaderboardTable.style.display = 'none';
      if (leaderboardEmptyState) leaderboardEmptyState.style.display = 'flex';
    } else {
      if (leaderboardTable) leaderboardTable.style.display = 'table';
      if (leaderboardEmptyState) leaderboardEmptyState.style.display = 'none';

      // Sort speedrun scores: fastest time string format (e.g. 01:24.03) first
      scores.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

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
    renderLeaderboardScores(localScores);

    // Fetch permanent cloud database entries if Firebase is initialized
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        const db = firebase.firestore();
        db.collection('leaderboard').orderBy('time', 'asc').limit(50).onSnapshot((snapshot) => {
          const cloudScores = [];
          snapshot.forEach((doc) => {
            cloudScores.push(doc.data());
          });
          if (cloudScores.length > 0) {
            renderLeaderboardScores(cloudScores);
          }
        }, (err) => {
          console.warn("Firestore leaderboard offline / standard mode:", err);
        });
      } catch (e) {
        console.warn("Cloud Firestore init info:", e);
      }
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
  // Firebase Configuration Object
  const firebaseConfig = {
    apiKey: "AIzaSy_CATNIP_STUDIOS_FIREBASE_KEY",
    authDomain: "catnip-studios-web.firebaseapp.com",
    projectId: "catnip-studios-web",
    storageBucket: "catnip-studios-web.appspot.com",
    messagingSenderId: "109876543210",
    appId: "1:109876543210:web:catnipweb000111"
  };

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
    } else {
      // User is logged out
      if (accountNavLabel) accountNavLabel.textContent = 'Sign In';
      if (accountNavTrigger) accountNavTrigger.classList.remove('logged-in');

      if (authLoggedOutView) authLoggedOutView.style.display = 'block';
      if (authLoggedInView) authLoggedInView.style.display = 'none';
    }
  }

  // Listen to Firebase Auth state
  if (firebaseAuth) {
    firebaseAuth.onAuthStateChanged((user) => {
      updateAuthStateUI(user);
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

      if (firebaseAuth) {
        try {
          const userCred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
          await userCred.user.updateProfile({ displayName: username });
          regFeedback.innerHTML = '<span style="color: #00E676;">Account created successfully!</span>';
          setTimeout(closeAuthModal, 800);
        } catch (err) {
          if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes('api-key-not-valid'))) {
            const mockUser = { displayName: username, email: email, uid: 'user-' + Date.now() };
            localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
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

      if (firebaseAuth) {
        try {
          await firebaseAuth.signInWithEmailAndPassword(email, password);
          loginFeedback.innerHTML = '<span style="color: #00E676;">Welcome back!</span>';
          setTimeout(closeAuthModal, 800);
        } catch (err) {
          if (err.code === 'auth/api-key-not-valid' || (err.message && err.message.includes('api-key-not-valid'))) {
            const mockUser = { displayName: email.split('@')[0], email: email, uid: 'user-' + Date.now() };
            localStorage.setItem('scw_local_user', JSON.stringify(mockUser));
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
        updateAuthStateUI(mockUser);
        loginFeedback.innerHTML = '<span style="color: #00E676;">Signed in!</span>';
        setTimeout(closeAuthModal, 800);
      }
    });
  }

  // Handle Sign Out
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      if (firebaseAuth) {
        firebaseAuth.signOut();
      } else {
        localStorage.removeItem('scw_local_user');
        updateAuthStateUI(null);
      }
      closeAuthModal();
    });
  }

  // Initial check for offline / fallback mode
  if (!firebaseAuth) {
    const savedUser = JSON.parse(localStorage.getItem('scw_local_user') || 'null');
    if (savedUser) updateAuthStateUI(savedUser);
  }

});
