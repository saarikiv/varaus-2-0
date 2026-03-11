// Feature: varaus, Property 7: Booking filtering — past instance exclusion
// Validates: Requirement 7.8

import { expect } from 'chai';
import fc from 'fast-check';
import { filterPastBookings } from '../../src/dev/helpers/bookingHelper.js';

/**
 * Arbitrary for a booking value — simple object keyed by user UID.
 */
const bookingValueArb = fc.record({
  user: fc.string({ minLength: 1, maxLength: 20 }),
  transactionReference: fc.string({ minLength: 1, maxLength: 20 }),
});

/**
 * Build an inputBookings object from an array of [instanceId, value] pairs.
 */
function buildBookings(entries) {
  const bookings = {};
  for (const [id, val] of entries) {
    bookings[String(id)] = { uid1: val };
  }
  return bookings;
}

describe('Property 7: Booking filtering — past instance exclusion', function () {

  it('no remaining booking has instanceTimestamp + slotDuration < currentTime', function () {
    // **Validates: Requirement 7.8**
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.integer({ min: 0, max: 2000000000000 }), bookingValueArb),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 1, max: 7200000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (entries, slotDuration, currentTime) => {
          const inputBookings = buildBookings(entries);
          const result = filterPastBookings(inputBookings, slotDuration, currentTime);

          for (const instanceId in result) {
            const referenceTime = Number(instanceId) + slotDuration;
            expect(referenceTime).to.be.at.least(currentTime,
              `instance ${instanceId} with referenceTime ${referenceTime} should not be in result (currentTime=${currentTime})`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all bookings where instanceTimestamp + slotDuration >= currentTime are retained', function () {
    // **Validates: Requirement 7.8**
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.integer({ min: 0, max: 2000000000000 }), bookingValueArb),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 1, max: 7200000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (entries, slotDuration, currentTime) => {
          const inputBookings = buildBookings(entries);
          const result = filterPastBookings(inputBookings, slotDuration, currentTime);

          for (const instanceId in inputBookings) {
            const referenceTime = Number(instanceId) + slotDuration;
            if (referenceTime >= currentTime) {
              expect(result).to.have.property(instanceId);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty object when inputBookings is null or undefined', function () {
    // **Validates: Requirement 7.8**
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        fc.integer({ min: 1, max: 7200000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (inputBookings, slotDuration, currentTime) => {
          const result = filterPastBookings(inputBookings, slotDuration, currentTime);
          expect(result).to.deep.equal({});
        }
      ),
      { numRuns: 100 }
    );
  });

  it('result is a new object (not the same reference as input)', function () {
    // **Validates: Requirement 7.8**
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.integer({ min: 0, max: 2000000000000 }), bookingValueArb),
          { minLength: 0, maxLength: 20 }
        ),
        fc.integer({ min: 1, max: 7200000 }),
        fc.integer({ min: 0, max: 2000000000000 }),
        (entries, slotDuration, currentTime) => {
          const inputBookings = buildBookings(entries);
          const result = filterPastBookings(inputBookings, slotDuration, currentTime);
          expect(result).to.not.equal(inputBookings);
        }
      ),
      { numRuns: 100 }
    );
  });

});
