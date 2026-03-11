// Feature: varaus, Property 9: Shop item filtering — locked and one-time exclusion
// Validates: Requirements 8.2, 8.3

import { expect } from 'chai';
import fc from 'fast-check';
import { filterShopItems } from '../../src/dev/helpers/shopHelper.js';

/**
 * Arbitrary for a single shop item value (without the key, which is the object key).
 */
const shopItemArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }),
  type: fc.constantFrom('time', 'count', 'special'),
  price: fc.double({ min: 0.01, max: 999.99, noNaN: true }),
  locked: fc.boolean(),
  oneTime: fc.boolean(),
});

/**
 * Build a shopItemsObj from an array of [key, item] pairs.
 * Uses unique keys to avoid collisions.
 */
function buildShopItemsObj(entries) {
  const obj = {};
  for (const [key, item] of entries) {
    obj[key] = item;
  }
  return obj;
}

/**
 * Arbitrary for a list of [key, shopItem] entries with unique keys.
 */
const shopEntriesArb = fc.uniqueArray(
  fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && s !== '__proto__'),
    shopItemArb
  ),
  { minLength: 0, maxLength: 20, selector: ([key]) => key }
);

describe('Property 9: Shop item filtering — locked and one-time exclusion', function () {

  it('no locked items appear in the result', function () {
    // **Validates: Requirement 8.2**
    fc.assert(
      fc.property(
        shopEntriesArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (entries, purchasedKeys) => {
          const shopItemsObj = buildShopItemsObj(entries);
          const result = filterShopItems(shopItemsObj, purchasedKeys);

          for (const item of result) {
            expect(item.locked).to.not.equal(true,
              `locked item "${item.key}" should not appear in result`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no items whose key is in purchasedOneTimeKeys appear in the result', function () {
    // **Validates: Requirement 8.3**
    fc.assert(
      fc.property(
        shopEntriesArb,
        (entries) => {
          const shopItemsObj = buildShopItemsObj(entries);
          const allKeys = Object.keys(shopItemsObj);
          // Pick a random subset of keys as purchased
          const purchasedKeys = allKeys.filter((_, i) => i % 2 === 0);
          const result = filterShopItems(shopItemsObj, purchasedKeys);

          const resultKeys = result.map(item => item.key);
          for (const pk of purchasedKeys) {
            expect(resultKeys).to.not.include(pk,
              `purchased key "${pk}" should not appear in result`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all non-locked, non-purchased items are retained', function () {
    // **Validates: Requirements 8.2, 8.3**
    fc.assert(
      fc.property(
        shopEntriesArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (entries, purchasedKeys) => {
          const shopItemsObj = buildShopItemsObj(entries);
          const result = filterShopItems(shopItemsObj, purchasedKeys);
          const resultKeys = new Set(result.map(item => item.key));

          for (const [key, item] of entries) {
            if (!item.locked && !purchasedKeys.includes(key)) {
              expect(resultKeys.has(key)).to.equal(true,
                `non-locked, non-purchased item "${key}" should be retained`);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each result item has a key property matching its original object key', function () {
    // **Validates: Requirements 8.2, 8.3**
    fc.assert(
      fc.property(
        shopEntriesArb,
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (entries, purchasedKeys) => {
          const shopItemsObj = buildShopItemsObj(entries);
          const result = filterShopItems(shopItemsObj, purchasedKeys);

          for (const item of result) {
            expect(item).to.have.property('key');
            expect(shopItemsObj).to.have.property(item.key);
            // The item's fields (except key) should match the original
            expect(item.title).to.equal(shopItemsObj[item.key].title);
            expect(item.type).to.equal(shopItemsObj[item.key].type);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty array when shopItemsObj is null or undefined', function () {
    // **Validates: Requirements 8.2, 8.3**
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (shopItemsObj, purchasedKeys) => {
          const result = filterShopItems(shopItemsObj, purchasedKeys);
          expect(result).to.be.an('array').that.is.empty;
        }
      ),
      { numRuns: 100 }
    );
  });

});
