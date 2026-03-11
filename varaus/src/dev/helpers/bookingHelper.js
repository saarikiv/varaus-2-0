/**
 * Pure helper functions for booking processing.
 *
 * Extracted from the bookings action for testability.
 */

/**
 * Filter out past booking instances.
 *
 * A booking instance is considered past when its timestamp plus the slot
 * duration is less than the current time, i.e. the slot occurrence has
 * already ended.
 *
 * @param {Object} inputBookings - Raw bookings keyed by instance timestamp.
 *   Each value is an object keyed by user UID with `{ user, transactionReference }`.
 * @param {number} slotDuration - Duration of the slot in milliseconds (end − start).
 * @param {number} currentTime - The current time as a Unix timestamp in milliseconds.
 * @returns {Object} A new object containing only the booking instances that have not yet passed.
 */
export function filterPastBookings(inputBookings, slotDuration, currentTime) {
  if (!inputBookings) return {};
  const result = {};
  for (const instanceId in inputBookings) {
    const referenceTime = Number(instanceId) + slotDuration;
    if (referenceTime >= currentTime) {
      result[instanceId] = inputBookings[instanceId];
    }
  }
  return result;
}

/**
 * Separate bookings into all-user bookings and current-user bookings.
 *
 * Iterates over (already-filtered) booking instances and builds two arrays:
 * - `allBookings`: one entry per instance with reservation count and participant list
 * - `userBookings`: entries for instances where the given UID is a participant
 *
 * Both arrays are sorted by instance timestamp ascending.
 *
 * @param {Object} filteredBookings - Bookings keyed by instance timestamp (past instances already removed).
 * @param {string} uid - The authenticated user's UID.
 * @returns {{ allBookings: Array, userBookings: Array }}
 */
export function separateBookingsByUser(filteredBookings, uid) {
  const allBookings = [];
  const userBookings = [];

  for (const instanceId in filteredBookings) {
    const instanceObj = filteredBookings[instanceId];
    const booking = {
      instance: instanceId,
      reservations: 0,
      participants: []
    };

    for (const user in instanceObj) {
      booking.reservations++;
      booking.participants.push({
        key: user,
        name: instanceObj[user].user,
        transactionReference: instanceObj[user].transactionReference
      });
      if (user === uid) {
        userBookings.push({
          item: instanceId,
          txRef: instanceObj[user].transactionReference
        });
      }
    }

    allBookings.push(booking);
  }

  userBookings.sort((a, b) => a.item - b.item);
  allBookings.sort((a, b) => a.instance - b.instance);

  return { allBookings, userBookings };
}
