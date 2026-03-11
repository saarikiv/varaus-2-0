// Feature: varaus, Property 6: Past slot detection correctness
// Validates: Requirements 6.5, 22.1, 22.2

import { expect } from 'chai';
import fc from 'fast-check';
import { hasTimePassed, getSlotTimeLocal, mapDay } from '../../src/dev/helpers/timeHelper.js';

describe('Property 6: Past slot detection correctness', function () {

  it('hasTimePassed is consistent with manual getSlotTimeLocal comparison', function () {
    // **Validates: Requirements 6.5, 22.1, 22.2**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.integer({ min: 0, max: 86399999 }),
        (dayNumber, startTime) => {
          const result = hasTimePassed(dayNumber, startTime);
          const slotTime = getSlotTimeLocal(0, startTime, dayNumber);
          const expected = slotTime.getTime() < Date.now();
          expect(result).to.equal(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasTimePassed returns a boolean', function () {
    // **Validates: Requirements 6.5, 22.1, 22.2**
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.integer({ min: 0, max: 86399999 }),
        (dayNumber, startTime) => {
          const result = hasTimePassed(dayNumber, startTime);
          expect(result).to.be.a('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns true for slots computed to be in the past', function () {
    // **Validates: Requirements 6.5, 22.1, 22.2**
    // Pick a day earlier this week with startTime=0 (midnight) — guaranteed past unless today is Monday at midnight
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86399999 }),
        (startTime) => {
          const now = new Date();
          const todayISO = mapDay(now.getDay());
          // Use a day that's definitely in the past this week: 2 days before today
          const pastDay = todayISO - 2;
          if (pastDay >= 1) {
            // This day is earlier this week, with startTime=0 it should be in the past
            const slotTime = getSlotTimeLocal(0, 0, pastDay);
            if (slotTime.getTime() < Date.now()) {
              expect(hasTimePassed(pastDay, 0)).to.be.true;
            }
          }
          // Always passes — we only assert when we have a guaranteed past slot
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for slots computed to be in the future', function () {
    // **Validates: Requirements 6.5, 22.1, 22.2**
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 86399999 }),
        (startTime) => {
          const now = new Date();
          const todayISO = mapDay(now.getDay());
          // Use a day that's definitely in the future this week: 2 days after today
          const futureDay = todayISO + 2;
          if (futureDay <= 7) {
            // This day is later this week, with max startTime it should be in the future
            const slotTime = getSlotTimeLocal(0, 86399999, futureDay);
            if (slotTime.getTime() > Date.now()) {
              expect(hasTimePassed(futureDay, 86399999)).to.be.false;
            }
          }
          // Always passes — we only assert when we have a guaranteed future slot
        }
      ),
      { numRuns: 100 }
    );
  });

});
