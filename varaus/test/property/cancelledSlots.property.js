// Feature: varaus, Property 5: Cancelled slot marking consistency
// Validates: Requirement 6.4

import { expect } from 'chai';
import fc from 'fast-check';
import { mergeCancelledSlots } from '../../src/dev/helpers/slotHelper.js';

/**
 * Arbitrary for a slot key — Firebase-style push ID (non-empty alphanumeric string).
 * Prefixed with 'slot_' to avoid collisions with Object.prototype property names
 * (e.g. "valueOf", "toString") which would cause false positives in property lookups.
 */
const slotKeyArb = fc.stringMatching(/^[a-zA-Z0-9]{1,16}$/).map(s => `slot_${s}`);

/**
 * Simple processCancelFn that sets cancelled = true and attaches cancelInfo,
 * matching the real callback behaviour.
 */
function testProcessCancelFn(slot, cancelRecord) {
  slot.cancelled = true;
  slot.cancelInfo = cancelRecord;
}

/**
 * Build a slot object with the given key.
 */
function makeSlot(key) {
  return {
    key,
    day: 1,
    start: 61200000,
    end: 68400000,
    blocked: false,
    reserver: '',
    cancelled: false,
  };
}

describe('Property 5: Cancelled slot marking consistency', function () {

  it('slots with keys present in cancelledSlots get cancelled: true', function () {
    // **Validates: Requirement 6.4**
    fc.assert(
      fc.property(
        fc.uniqueArray(slotKeyArb, { minLength: 1, maxLength: 20 }),
        (keys) => {
          const slots = keys.map(makeSlot);
          const cancelledSlots = {};
          keys.forEach(k => { cancelledSlots[k] = { instance: Date.now(), reason: 'test' }; });

          mergeCancelledSlots(slots, cancelledSlots, testProcessCancelFn);

          for (const slot of slots) {
            expect(slot.cancelled).to.equal(true,
              `slot with key "${slot.key}" should be cancelled`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('slots with keys NOT present in cancelledSlots get cancelled: false', function () {
    // **Validates: Requirement 6.4**
    fc.assert(
      fc.property(
        fc.uniqueArray(slotKeyArb, { minLength: 1, maxLength: 20 }),
        (keys) => {
          const slots = keys.map(makeSlot);
          const cancelledSlots = {};

          mergeCancelledSlots(slots, cancelledSlots, testProcessCancelFn);

          for (const slot of slots) {
            expect(slot.cancelled).to.equal(false,
              `slot with key "${slot.key}" should NOT be cancelled`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when cancelledSlots is null/undefined, all slots get cancelled: false', function () {
    // **Validates: Requirement 6.4**
    fc.assert(
      fc.property(
        fc.uniqueArray(slotKeyArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom(null, undefined),
        (keys, cancelledSlots) => {
          const slots = keys.map(makeSlot);

          mergeCancelledSlots(slots, cancelledSlots, testProcessCancelFn);

          for (const slot of slots) {
            expect(slot.cancelled).to.equal(false,
              `slot with key "${slot.key}" should NOT be cancelled when cancelledSlots is ${cancelledSlots}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('mixed: only slots with matching keys are cancelled, others are not', function () {
    // **Validates: Requirement 6.4**
    fc.assert(
      fc.property(
        fc.uniqueArray(slotKeyArb, { minLength: 2, maxLength: 20 }),
        (keys) => {
          const splitIndex = Math.max(1, Math.floor(keys.length / 2));
          const cancelledKeys = keys.slice(0, splitIndex);

          const slots = keys.map(makeSlot);
          const cancelledSlots = {};
          cancelledKeys.forEach(k => { cancelledSlots[k] = { instance: Date.now(), reason: 'cancelled' }; });

          mergeCancelledSlots(slots, cancelledSlots, testProcessCancelFn);

          for (const slot of slots) {
            if (cancelledKeys.includes(slot.key)) {
              expect(slot.cancelled).to.equal(true,
                `slot "${slot.key}" should be cancelled`);
              expect(slot.cancelInfo).to.exist;
            } else {
              expect(slot.cancelled).to.equal(false,
                `slot "${slot.key}" should NOT be cancelled`);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns the same array reference (mutated in place)', function () {
    // **Validates: Requirement 6.4**
    fc.assert(
      fc.property(
        fc.uniqueArray(slotKeyArb, { minLength: 0, maxLength: 20 }),
        (keys) => {
          const slots = keys.map(makeSlot);
          const result = mergeCancelledSlots(slots, {}, testProcessCancelFn);
          expect(result).to.equal(slots);
        }
      ),
      { numRuns: 100 }
    );
  });

});
