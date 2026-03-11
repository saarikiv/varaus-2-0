// Feature: varaus, Property 8: Booking separation by user
// Validates: Requirement 7.9

import { expect } from 'chai';
import fc from 'fast-check';
import { separateBookingsByUser } from '../../src/dev/helpers/bookingHelper.js';

/**
 * Arbitrary for a single booking entry (user data within an instance).
 */
const bookingEntryArb = fc.record({
  user: fc.string({ minLength: 1, maxLength: 20 }),
  transactionReference: fc.string({ minLength: 1, maxLength: 30 }),
});

/**
 * Arbitrary for a UID string.
 */
const uidArb = fc.string({ minLength: 1, maxLength: 20 });

/**
 * Build a filteredBookings object from generated data.
 * Each instance is keyed by a timestamp string and contains 1+ user entries keyed by UID.
 */
function buildFilteredBookings(instances) {
  const bookings = {};
  for (const { instanceId, users } of instances) {
    const instanceObj = {};
    for (const { uid, entry } of users) {
      instanceObj[uid] = entry;
    }
    bookings[String(instanceId)] = instanceObj;
  }
  return bookings;
}

/**
 * Arbitrary for an array of booking instances, each with 1+ user participants.
 * Returns { instances, allUids } where allUids is the set of all generated UIDs.
 */
const bookingDataArb = fc.array(
  fc.record({
    instanceId: fc.integer({ min: 1, max: 2000000000000 }),
    users: fc.array(
      fc.record({
        uid: uidArb,
        entry: bookingEntryArb,
      }),
      { minLength: 1, maxLength: 5 }
    ),
  }),
  { minLength: 0, maxLength: 15 }
);

describe('Property 8: Booking separation by user', function () {

  it('allBookings contains one entry per instance in filteredBookings', function () {
    // **Validates: Requirement 7.9**
    fc.assert(
      fc.property(
        bookingDataArb,
        uidArb,
        (instances, uid) => {
          const filteredBookings = buildFilteredBookings(instances);
          const { allBookings } = separateBookingsByUser(filteredBookings, uid);

          const expectedCount = Object.keys(filteredBookings).length;
          expect(allBookings).to.have.lengthOf(expectedCount);

          const instanceIds = allBookings.map(b => b.instance);
          const expectedIds = Object.keys(filteredBookings);
          expect(instanceIds.sort()).to.deep.equal(expectedIds.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('userBookings contains exactly those instances where the UID is a participant key', function () {
    // **Validates: Requirement 7.9**
    fc.assert(
      fc.property(
        bookingDataArb,
        uidArb,
        (instances, uid) => {
          const filteredBookings = buildFilteredBookings(instances);
          const { userBookings } = separateBookingsByUser(filteredBookings, uid);

          // Compute expected user booking instances
          const expectedItems = [];
          for (const instanceId in filteredBookings) {
            if (Object.prototype.hasOwnProperty.call(filteredBookings[instanceId], uid)) {
              expectedItems.push(instanceId);
            }
          }

          const actualItems = userBookings.map(b => b.item);
          expect(actualItems.sort()).to.deep.equal(expectedItems.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('allBookings entries have correct reservation counts matching participant count', function () {
    // **Validates: Requirement 7.9**
    fc.assert(
      fc.property(
        bookingDataArb,
        uidArb,
        (instances, uid) => {
          const filteredBookings = buildFilteredBookings(instances);
          const { allBookings } = separateBookingsByUser(filteredBookings, uid);

          for (const booking of allBookings) {
            const instanceObj = filteredBookings[booking.instance];
            const expectedCount = Object.keys(instanceObj).length;
            expect(booking.reservations).to.equal(expectedCount);
            expect(booking.participants).to.have.lengthOf(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('both arrays are sorted by instance/item ascending', function () {
    // **Validates: Requirement 7.9**
    fc.assert(
      fc.property(
        bookingDataArb,
        uidArb,
        (instances, uid) => {
          const filteredBookings = buildFilteredBookings(instances);
          const { allBookings, userBookings } = separateBookingsByUser(filteredBookings, uid);

          for (let i = 1; i < allBookings.length; i++) {
            expect(Number(allBookings[i].instance)).to.be.at.least(
              Number(allBookings[i - 1].instance)
            );
          }

          for (let i = 1; i < userBookings.length; i++) {
            expect(Number(userBookings[i].item)).to.be.at.least(
              Number(userBookings[i - 1].item)
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

});
