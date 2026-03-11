// Feature: varaus, Property 4: Slot sorting invariant
// Validates: Requirement 6.3

import { expect } from 'chai';
import fc from 'fast-check';
import { sortSlotsByStartTime } from '../../src/dev/helpers/slotHelper.js';

/**
 * Arbitrary for generating a slot object matching the Slot data model.
 */
const slotArb = fc.record({
  key: fc.string({ minLength: 1, maxLength: 20 }),
  day: fc.integer({ min: 1, max: 7 }),
  start: fc.integer({ min: 0, max: 86399999 }),
  end: fc.integer({ min: 0, max: 86399999 }),
  blocked: fc.boolean(),
  reserver: fc.string({ minLength: 0, maxLength: 20 }),
  cancelled: fc.boolean(),
});

describe('Property 4: Slot sorting invariant', function () {

  it('result is sorted by start ascending — no adjacent pair has slots[i].start > slots[i+1].start', function () {
    // **Validates: Requirement 6.3**
    fc.assert(
      fc.property(
        fc.array(slotArb, { minLength: 0, maxLength: 50 }),
        (slots) => {
          const sorted = sortSlotsByStartTime(slots);
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].start).to.be.at.most(sorted[i + 1].start);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorted array has the same length as the input', function () {
    // **Validates: Requirement 6.3**
    fc.assert(
      fc.property(
        fc.array(slotArb, { minLength: 0, maxLength: 50 }),
        (slots) => {
          const sorted = sortSlotsByStartTime(slots);
          expect(sorted).to.have.lengthOf(slots.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all original elements are preserved — no elements lost or added', function () {
    // **Validates: Requirement 6.3**
    fc.assert(
      fc.property(
        fc.array(slotArb, { minLength: 0, maxLength: 50 }),
        (slots) => {
          const sorted = sortSlotsByStartTime(slots);

          // Every element in the input appears in the output (by reference)
          for (const slot of slots) {
            expect(sorted).to.include(slot);
          }
          // Every element in the output appears in the input (by reference)
          for (const slot of sorted) {
            expect(slots).to.include(slot);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

});
