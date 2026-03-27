/**
 * Property-based tests for active booking detection logic.
 * Feature: profile-deletion
 *
 * **Validates: Requirements 3.1**
 */

const fc = require('fast-check');
const { isBookingActive } = require('../../src/post/postDeleteProfile');

describe('Active booking detection property-based tests', () => {

  /**
   * Property: For any set of bookings, a booking is active if and only if
   * its slot end time (slotTime + slotInfo.end - slotInfo.start) is in the future.
   *
   * **Validates: Requirements 3.1**
   */
  test('Property: isBookingActive returns true iff slotTime + slotInfo.end - slotInfo.start > now', () => {
    // Arbitrary for a slot definition: start and end are ms-offsets within a day
    const slotInfoArb = fc.record({
      start: fc.integer({ min: 0, max: 86400000 }),  // 0 to 24h in ms
      end: fc.integer({ min: 0, max: 86400000 }),
    }).filter(s => s.end >= s.start); // end >= start for a valid slot

    // Arbitrary for a booking with a slotTime timestamp
    const bookingArb = fc.record({
      slotTime: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER - 86400000 }),
    });

    // Arbitrary for "now" timestamp
    const nowArb = fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER });

    fc.assert(
      fc.property(
        bookingArb,
        slotInfoArb,
        nowArb,
        (booking, slotInfo, now) => {
          const result = isBookingActive(booking, slotInfo, now);
          const slotEndTime = booking.slotTime + slotInfo.end - slotInfo.start;
          const expected = slotEndTime > now;

          expect(result).toBe(expected);
        }
      ),
      { numRuns: 1000 }
    );
  });
});
