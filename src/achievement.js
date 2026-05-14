export class Achievement {
  /**
   * Create a new achievement.
   *
   * @param {Object} opts Options for the achievement.
   * @param {string} opts.id Unique identifier for the achievement.
   * @param {string} opts.name Display name for the achievement.
   * @param {string} opts.description Description of the achievement.
   * @param {function} opts.condition Function that returns true when the achievement should unlock. Receives the game instance.
   * @param {function} [opts.onUnlock] Optional reward callback invoked when the achievement unlocks.
   */
  constructor({ id, name, description, condition, onUnlock }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.condition = condition;
    this.onUnlock = onUnlock;
    this.unlocked = false;
  }

  /**
   * Check whether the achievement should unlock. If so, mark as unlocked and
   * trigger the optional callback.
   *
   * @param {Game} game The game instance.
   */
  tryUnlock(game) {
    if (this.unlocked) return false;
    if (this.condition(game)) {
      this.unlocked = true;
      if (typeof this.onUnlock === 'function') {
        this.onUnlock(game);
      }
      return true;
    }
    return false;
  }
}
