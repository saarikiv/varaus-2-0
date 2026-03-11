// Feature: varaus, Property 13: Days remaining calculation
// Validates: Requirement 22.5

import { expect } from 'chai';
import fc from 'fast-check';
import { daysRemaining } from '../../src/dev/helpers/timeHelper.js';

describe('Property 13: Days remaining calculation', function () {

  it('returns a positive value for timestamps more than 1 day in the future', function () {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 3650 }),
        (daysAhead) => {
          const futureTime = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
          const result = daysRemaining(futureTime);
          expect(result).to.be.greaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns a negative value for timestamps more than 1 day in the past', function () {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 3650 }),
        (daysAgo) => {
          const pastTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
          const result = daysRemaining(pastTime);
          expect(result).to.be.lessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when input is 0', function () {
    fc.assert(
      fc.property(
        fc.constant(0),
        (input) => {
          const result = daysRemaining(input);
          expect(result).to.equal(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns an integer', function () {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          fc.constant(0)
        ),
        (timestamp) => {
          const result = daysRemaining(timestamp);
          expect(Number.isInteger(result)).to.be.true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for a timestamp exactly N days from now, result is approximately N', function () {
    fc.assert(
      fc.property(
        fc.integer({ min: -3650, max: 3650 }),
        (n) => {
          const timestamp = Date.now() + n * 24 * 60 * 60 * 1000;
          const result = daysRemaining(timestamp);
          // Math.round can differ by at most 1 due to sub-day offset from Date.now()
          expect(Math.abs(result - n)).to.be.at.most(1);
        }
      ),
      { numRuns: 100 }
    );
  });

});
