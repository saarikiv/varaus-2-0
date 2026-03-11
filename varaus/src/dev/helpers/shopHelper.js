/**
 * Pure helper functions for shop item processing.
 *
 * Extracted from the shop action for testability.
 */

/**
 * Filter shop items by excluding locked items and already-purchased one-time items.
 *
 * A shop item is excluded when:
 * - its `locked` flag is truthy (Requirement 8.2), or
 * - it is a one-time item whose key appears in `purchasedOneTimeKeys` (Requirement 8.3)
 *
 * Each returned item is augmented with a `key` property matching its object key.
 *
 * @param {Object} shopItemsObj - Raw shop items object keyed by item key,
 *   as returned from Firebase `/shopItems/`. Each value has at least
 *   `{ title, desc, type, price, locked, oneTime, ... }`.
 * @param {string[]} purchasedOneTimeKeys - Array of shop item keys the user
 *   has already purchased (from `user.transactions.details.oneTime`).
 * @returns {Array<Object>} Filtered array of shop items, each with a `key` property.
 */
export function filterShopItems(shopItemsObj, purchasedOneTimeKeys = []) {
  if (!shopItemsObj) return [];

  const result = [];
  for (const key in shopItemsObj) {
    if (!Object.prototype.hasOwnProperty.call(shopItemsObj, key)) continue;

    const item = shopItemsObj[key];
    if (item.locked) continue;
    if (purchasedOneTimeKeys.indexOf(key) !== -1) continue;

    result.push({ ...item, key });
  }
  return result;
}
