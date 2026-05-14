import { Generator } from './generator.js';
import { Upgrade } from './upgrade.js';
import { Achievement } from './achievement.js';

/**
 * Primary game class managing state, persistence and UI updates.
 */
class Game {
  constructor() {
    // Core stats
    this.orbits = 0;
    this.prestigePoints = 0;
    this.globalMultiplier = 1;

    // Collections
    this.generators = [];
    this.upgrades = [];
    this.achievements = [];

    // Last update timestamp for delta time calculations
    this.lastTick = performance.now();

    // Hook DOM elements
    this.resourceEl = document.getElementById('resourceCount');
    this.prestigePointsEl = document.getElementById('prestigePoints');
    this.generatorsList = document.getElementById('generatorsList');
    this.upgradesList = document.getElementById('upgradesList');
    this.achievementsList = document.getElementById('achievementsList');
    this.manualCollectButton = document.getElementById('manualCollect');
    this.prestigeButton = document.getElementById('prestigeButton');

    // Initialize game entities
    this.initEntities();

    // Bind UI interactions
    this.manualCollectButton.addEventListener('click', () => {
      this.collectManual();
    });
    this.prestigeButton.addEventListener('click', () => {
      if (confirm('Prestiging will reset your progress but grant prestige points. Proceed?')) {
        this.prestige();
      }
    });

    // Restore saved state if available
    this.load();

    // Render UI lists
    this.renderGenerators();
    this.renderUpgrades();
    this.renderAchievements();

    // Start game loop
    this.loop();
  }

  /**
   * Create default generators, upgrades and achievements.
   */
  initEntities() {
    // Generators definitions
    this.generators = [
      new Generator({ id: 'satellite', name: 'Satellite', baseCost: 10, costMultiplier: 1.15, baseRate: 0.1 }),
      new Generator({ id: 'station', name: 'Space Station', baseCost: 100, costMultiplier: 1.15, baseRate: 1 }),
      new Generator({ id: 'colony', name: 'Orbital Colony', baseCost: 1000, costMultiplier: 1.2, baseRate: 10 }),
    ];

    // Upgrades definitions
    this.upgrades = [
      new Upgrade({
        id: 'global1',
        name: 'Efficient Solar Panels',
        description: 'Doubles all production.',
        cost: 100,
        effect: game => {
          game.globalMultiplier *= 2;
        },
      }),
      new Upgrade({
        id: 'satellite1',
        name: 'Satellite Thrusters',
        description: 'Satellites produce twice as many orbits.',
        cost: 250,
        effect: game => {
          const gen = game.generators.find(g => g.id === 'satellite');
          if (gen) {
            gen.baseRate *= 2;
          }
        },
      }),
      new Upgrade({
        id: 'station1',
        name: 'Station Efficiency',
        description: 'Space Stations produce twice as many orbits.',
        cost: 1000,
        effect: game => {
          const gen = game.generators.find(g => g.id === 'station');
          if (gen) {
            gen.baseRate *= 2;
          }
        },
      }),
    ];

    // Achievements definitions
    this.achievements = [
      new Achievement({
        id: 'firstOrbit',
        name: 'First Orbit',
        description: 'Collect your first orbit.',
        condition: g => g.orbits >= 1,
        onUnlock: g => {
          // Small reward for first achievement
          g.orbits += 1;
        },
      }),
      new Achievement({
        id: 'hundredOrbits',
        name: 'Hundred Orbits',
        description: 'Accumulate 100 orbits.',
        condition: g => g.orbits >= 100,
        onUnlock: g => {
          g.orbits += 10;
        },
      }),
      new Achievement({
        id: 'millionOrbits',
        name: 'Million Orbits',
        description: 'Reach 1,000,000 orbits.',
        condition: g => g.orbits >= 1_000_000,
        onUnlock: g => {
          g.prestigePoints += 10;
        },
      }),
    ];
  }

  /**
   * Calculate total production per second from all generators and prestige multipliers.
   */
  totalProductionPerSecond() {
    let total = 0;
    for (const gen of this.generators) {
      total += gen.production();
    }
    // Multiply by global multiplier and prestige multiplier
    return total * this.globalMultiplier * (1 + this.prestigePoints * 0.1);
  }

  /**
   * Manual collection adds a base number of orbits for each click.
   */
  collectManual() {
    this.orbits += 1 * this.globalMultiplier;
    this.updateResourceDisplay();
    this.save();
  }

  /**
   * Main update loop. Calculates delta time in seconds and awards orbits
   * based on production. Also checks for achievement unlocks and updates UI.
   */
  loop() {
    const now = performance.now();
    const delta = (now - this.lastTick) / 1000;
    this.lastTick = now;
    this.orbits += this.totalProductionPerSecond() * delta;
    this.updateResourceDisplay();
    this.checkAchievements();
    this.updateGeneratorButtons();
    this.updateUpgradeButtons();
    // Save progress every 10 seconds
    if (Math.floor(now / 10000) !== Math.floor((now - delta * 1000) / 10000)) {
      this.save();
    }
    requestAnimationFrame(() => this.loop());
  }

  /**
   * Render the list of generators and attach purchase handlers.
   */
  renderGenerators() {
    this.generatorsList.innerHTML = '';
    for (const gen of this.generators) {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `<strong>${gen.name}</strong><br>Owned: <span id="${gen.id}-count">${gen.count}</span><br>Rate: ${gen.baseRate.toFixed(2)} /s`;
      const btn = document.createElement('button');
      btn.id = `${gen.id}-buy`;
      btn.textContent = `Buy (cost: ${gen.cost.toFixed(0)})`;
      btn.addEventListener('click', () => {
        this.buyGenerator(gen.id);
      });
      li.appendChild(info);
      li.appendChild(btn);
      this.generatorsList.appendChild(li);
    }
  }

  /**
   * Render the list of upgrades and attach purchase handlers.
   */
  renderUpgrades() {
    this.upgradesList.innerHTML = '';
    for (const upg of this.upgrades) {
      const li = document.createElement('li');
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `<strong>${upg.name}</strong><br>${upg.description}`;
      const btn = document.createElement('button');
      btn.id = `${upg.id}-buy`;
      btn.textContent = `Buy (cost: ${upg.cost.toFixed(0)})`;
      btn.disabled = upg.purchased;
      btn.addEventListener('click', () => {
        const purchased = upg.buy(this);
        if (purchased) {
          btn.disabled = true;
          this.renderUpgrades(); // refresh labels
          this.updateResourceDisplay();
        }
      });
      li.appendChild(info);
      li.appendChild(btn);
      this.upgradesList.appendChild(li);
    }
  }

  /**
   * Render the list of achievements. Achievements remain visible but change style when unlocked.
   */
  renderAchievements() {
    this.achievementsList.innerHTML = '';
    for (const ach of this.achievements) {
      const li = document.createElement('li');
      li.id = `ach-${ach.id}`;
      li.className = ach.unlocked ? 'unlocked' : '';
      li.innerHTML = `<div class="info"><strong>${ach.name}</strong><br>${ach.description}</div>`;
      this.achievementsList.appendChild(li);
    }
  }

  /**
   * Update the resource display text.
   */
  updateResourceDisplay() {
    this.resourceEl.textContent = this.orbits.toFixed(1);
    this.prestigePointsEl.textContent = this.prestigePoints.toFixed(0);
  }

  /**
   * Update generator purchase buttons to reflect current costs and enable/disable state.
   */
  updateGeneratorButtons() {
    for (const gen of this.generators) {
      const btn = document.getElementById(`${gen.id}-buy`);
      const countEl = document.getElementById(`${gen.id}-count`);
      if (btn && countEl) {
        btn.textContent = `Buy (cost: ${gen.cost.toFixed(0)})`;
        btn.disabled = this.orbits < gen.cost;
        countEl.textContent = gen.count;
      }
    }
  }

  /**
   * Update upgrade buttons to disable them if purchased or unaffordable.
   */
  updateUpgradeButtons() {
    for (const upg of this.upgrades) {
      const btn = document.getElementById(`${upg.id}-buy`);
      if (btn) {
        btn.disabled = upg.purchased || this.orbits < upg.cost;
        btn.textContent = upg.purchased
          ? `Purchased`
          : `Buy (cost: ${upg.cost.toFixed(0)})`;
      }
    }
  }

  /**
   * Attempt to purchase a generator of the given id.
   * If the player can afford it, subtract the cost, increment count and
   * update the UI.
   */
  buyGenerator(id) {
    const gen = this.generators.find(g => g.id === id);
    if (!gen) return;
    const cost = gen.cost;
    if (this.orbits >= cost) {
      this.orbits -= cost;
      gen.count += 1;
      this.updateGeneratorButtons();
      this.updateResourceDisplay();
      this.save();
    }
  }

  /**
   * Check and unlock achievements when conditions are met.
   */
  checkAchievements() {
    for (const ach of this.achievements) {
      if (!ach.unlocked) {
        const unlocked = ach.tryUnlock(this);
        if (unlocked) {
          // Re-render achievements to reflect unlocked state
          const li = document.getElementById(`ach-${ach.id}`);
          if (li) {
            li.classList.add('unlocked');
          }
          // Provide a brief visual cue
          li?.classList.add('flash');
          setTimeout(() => li?.classList.remove('flash'), 1000);
        }
      }
    }
  }

  /**
   * Save game state to localStorage.
   */
  save() {
    const data = {
      orbits: this.orbits,
      prestigePoints: this.prestigePoints,
      globalMultiplier: this.globalMultiplier,
      generators: this.generators.map(g => ({ id: g.id, count: g.count, baseRate: g.baseRate })),
      upgrades: this.upgrades.map(u => ({ id: u.id, purchased: u.purchased })),
      achievements: this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked })),
      lastSave: Date.now(),
    };
    try {
      localStorage.setItem('orbitIdleSave', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save game', e);
    }
  }

  /**
   * Load saved state from localStorage. Handles offline progress.
   */
  load() {
    try {
      const raw = localStorage.getItem('orbitIdleSave');
      if (!raw) return;
      const data = JSON.parse(raw);
      this.orbits = data.orbits ?? 0;
      this.prestigePoints = data.prestigePoints ?? 0;
      this.globalMultiplier = data.globalMultiplier ?? 1;
      // Restore generator counts and baseRates
      for (const genState of data.generators ?? []) {
        const gen = this.generators.find(g => g.id === genState.id);
        if (gen) {
          gen.count = genState.count;
          gen.baseRate = genState.baseRate;
        }
      }
      // Restore upgrade purchase state
      for (const upgState of data.upgrades ?? []) {
        const upg = this.upgrades.find(u => u.id === upgState.id);
        if (upg) {
          upg.purchased = upgState.purchased;
        }
      }
      // Restore achievements unlock state
      for (const achState of data.achievements ?? []) {
        const ach = this.achievements.find(a => a.id === achState.id);
        if (ach) {
          ach.unlocked = achState.unlocked;
        }
      }
      // Calculate offline progress
      if (data.lastSave) {
        const now = Date.now();
        const elapsed = (now - data.lastSave) / 1000; // seconds
        const gain = this.totalProductionPerSecond() * elapsed;
        this.orbits += gain;
      }
    } catch (e) {
      console.warn('Could not load save', e);
    }
  }

  /**
   * Reset progress in exchange for prestige points. Prestige points increase
   * production permanently.
   */
  prestige() {
    // Determine prestige gained: square root of total orbits divided by 1k
    const prestigeGained = Math.floor(Math.sqrt(this.orbits / 1000));
    if (prestigeGained <= 0) return;
    this.prestigePoints += prestigeGained;
    // Reset state except prestige
    this.orbits = 0;
    this.globalMultiplier = 1;
    for (const gen of this.generators) {
      gen.count = 0;
      gen.baseRate = gen.baseRate; // base rate unaffected
    }
    for (const upg of this.upgrades) {
      upg.purchased = false;
    }
    for (const ach of this.achievements) {
      ach.unlocked = false;
    }
    this.renderGenerators();
    this.renderUpgrades();
    this.renderAchievements();
    this.updateResourceDisplay();
    this.save();
    alert(`Prestige! You earned ${prestigeGained} prestige point${prestigeGained !== 1 ? 's' : ''}.`);
  }
}

// Initialize game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line no-new
  new Game();
});
