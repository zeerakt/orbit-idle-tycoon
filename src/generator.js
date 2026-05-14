export class Generator {
  /**
   * Create a new generator.
   *
   * @param {Object} opts Options for the generator.
   * @param {string} opts.id Unique identifier for the generator.
   * @param {string} opts.name Display name for the generator.
   * @param {number} opts.baseCost Initial purchase cost.
   * @param {number} opts.costMultiplier Cost scaling factor per purchase.
   * @param {number} opts.baseRate Base production per second.
   */
  constructor({ id, name, baseCost, costMultiplier, baseRate }) {
    this.id = id;
    this.name = name;
    this.baseCost = baseCost;
    this.costMultiplier = costMultiplier;
    this.baseRate = baseRate;
    this.count = 0;
    this.bought = 0;
  }

  /**
   * Calculate the cost for purchasing the next generator.
   * Uses exponential cost scaling.
   */
  get cost() {
    return this.baseCost * Math.pow(this.costMultiplier, this.count);
  }

  /**
   * Return the total production per second contributed by this generator.
   * Additional multiplicative bonuses can be applied externally.
   */
  production() {
    return this.baseRate * this.count;
  }
}
