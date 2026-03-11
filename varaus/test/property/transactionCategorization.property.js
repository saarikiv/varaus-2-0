// Feature: varaus, Property 10: Transaction categorization correctness
// Validates: Requirements 12.2, 12.3, 12.4

import { expect } from 'chai';
import fc from 'fast-check';
import { categorizeTransactions } from '../../src/dev/helpers/transactionHelper.js';

/**
 * Arbitrary for a single raw transaction as stored in Firebase.
 * Generates random types, expiry times relative to `now`, and usage counts.
 */
function transactionArb(now) {
  return fc.record({
    type: fc.constantFrom('time', 'count', 'special'),
    // expires can be before or after `now`
    expires: fc.integer({ min: now - 365 * 86400000, max: now + 365 * 86400000 }),
    unusedtimes: fc.integer({ min: 0, max: 100 }),
    usetimes: fc.integer({ min: 0, max: 100 }),
    shopItem: fc.string({ minLength: 1, maxLength: 20 }),
    shopItemKey: fc.string({ minLength: 1, maxLength: 20 }),
    oneTime: fc.boolean(),
    details: fc.record({ transaction: fc.record({ paymentInstrumentType: fc.constantFrom('invoice', 'cash') }) })
  });
}

/**
 * Build an allTransactions object (keyed by timestamp string) from an array of transactions.
 */
function buildTransactionsObject(transactions) {
  const obj = {};
  transactions.forEach((tx, i) => {
    obj[String(1000000 + i)] = tx;
  });
  return obj;
}

describe('Property 10: Transaction categorization correctness', function () {

  const NOW = 1700000000000;

  it('each transaction appears in exactly one of valid or expired arrays', function () {
    // **Validates: Requirements 12.2**
    fc.assert(
      fc.property(
        fc.array(transactionArb(NOW), { minLength: 1, maxLength: 20 }),
        (transactions) => {
          const txObj = buildTransactionsObject(transactions);
          const result = categorizeTransactions(txObj, NOW);

          const validKeys = result.details.valid.map(d => d.purchasetime);
          const expiredKeys = result.details.expired.map(d => d.purchasetime);
          const allKeys = Object.keys(txObj);

          // Every input transaction appears in exactly one list
          for (const key of allKeys) {
            const inValid = validKeys.includes(key);
            const inExpired = expiredKeys.includes(key);
            expect(inValid || inExpired).to.be.true;
            expect(inValid && inExpired).to.be.false;
          }

          // No extra entries
          expect(validKeys.length + expiredKeys.length).to.equal(allKeys.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('count credits equal sum of unusedtimes from non-expired count transactions', function () {
    // **Validates: Requirements 12.3**
    fc.assert(
      fc.property(
        fc.array(transactionArb(NOW), { minLength: 1, maxLength: 20 }),
        (transactions) => {
          const txObj = buildTransactionsObject(transactions);
          const result = categorizeTransactions(txObj, NOW);

          let expectedCount = 0;
          for (const tx of transactions) {
            if (tx.type === 'count' && tx.expires > NOW) {
              expectedCount += tx.unusedtimes;
            }
          }

          expect(result.count).to.equal(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('time expiry equals max expires from non-expired time transactions', function () {
    // **Validates: Requirements 12.4**
    fc.assert(
      fc.property(
        fc.array(transactionArb(NOW), { minLength: 1, maxLength: 20 }),
        (transactions) => {
          const txObj = buildTransactionsObject(transactions);
          const result = categorizeTransactions(txObj, NOW);

          let expectedTime = 0;
          for (const tx of transactions) {
            if (tx.type === 'time' && tx.expires > NOW) {
              if (tx.expires > expectedTime) {
                expectedTime = tx.expires;
              }
            }
          }

          expect(result.time).to.equal(expectedTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('oneTime array contains shopItemKeys of all oneTime transactions', function () {
    // **Validates: Requirements 12.2**
    fc.assert(
      fc.property(
        fc.array(transactionArb(NOW), { minLength: 1, maxLength: 20 }),
        (transactions) => {
          const txObj = buildTransactionsObject(transactions);
          const result = categorizeTransactions(txObj, NOW);

          const expectedOneTimeKeys = transactions
            .filter(tx => tx.oneTime)
            .map(tx => tx.shopItemKey);

          expect(result.details.oneTime).to.have.members(expectedOneTimeKeys);
          expect(result.details.oneTime.length).to.equal(expectedOneTimeKeys.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid and expired arrays are sorted by expires ascending', function () {
    // **Validates: Requirements 12.2**
    fc.assert(
      fc.property(
        fc.array(transactionArb(NOW), { minLength: 2, maxLength: 20 }),
        (transactions) => {
          const txObj = buildTransactionsObject(transactions);
          const result = categorizeTransactions(txObj, NOW);

          for (let i = 1; i < result.details.valid.length; i++) {
            expect(result.details.valid[i].expires).to.be.at.least(
              result.details.valid[i - 1].expires
            );
          }

          for (let i = 1; i < result.details.expired.length; i++) {
            expect(result.details.expired[i].expires).to.be.at.least(
              result.details.expired[i - 1].expires
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns default empty result for null input', function () {
    // **Validates: Requirements 12.2**
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        fc.integer({ min: 0, max: 2000000000000 }),
        (input, now) => {
          const result = categorizeTransactions(input, now);
          expect(result.time).to.equal(0);
          expect(result.count).to.equal(0);
          expect(result.firstexpire).to.equal(0);
          expect(result.details.valid).to.deep.equal([]);
          expect(result.details.expired).to.deep.equal([]);
          expect(result.details.oneTime).to.deep.equal([]);
        }
      ),
      { numRuns: 100 }
    );
  });

});
