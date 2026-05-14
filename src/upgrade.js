export class Upgrade {
  /**
   * Create a new upgrade.
   *
   * @param {Object} opts Options for the upgrade.
   * @param {string} opts.id Unique identifier for the upgrade.
   * @param {string} opts.name Display name for the upgrade.
   * @param {string} opts.description Description of the upgrade effect.
   * @param {number} opts.cost Cost of the upgrade.
   * @param {function} opts.effect Callback applied when the upgrade is purchased. Receives the game instance.
   */
  constructor({ id, name, description, cost, effect }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.effect = effect;
    this.purchased = false;
  }

  /**
   * Attempt to purchase the upgrade using the provided game context.
   * If the player has enough orbits and the upgrade hasn't been purchased,
   * subtract the cost and apply the effect.
   *
   * @param {Game} game The game instance.
   */
  buy(game) {
    if (this.purchased) return false;
    if (game.orbits < this.cost) return false;
    game.orbits -= this.cost;
    this.purchased = true;
    if (typeof this.effect === 'function') {
      this.effect(game);
    }
    return true;
  }
}
