/**
 * Pure helper functions for timetable slot processing.
 *
 * Extracted from the timetable reducer and slots action for testability.
 */

/**
 * Sort slots by start time in ascending order.
 * Slots without a valid `start` value are left in their original relative order.
 *
 * @param {Array<{start: number}>} slots - Array of slot objects with a `start` field (ms from midnight)
 * @returns {Array<{start: number}>} New array sorted by `start` ascending
 */
export function sortSlotsByStartTime(slots) {
  return [...slots].sort((a, b) => {
    if (a.start != null && b.start != null) {
      return a.start - b.start;
    }
    return 0;
  });
}

/**
 * Merge cancelled slot data into a slots array.
 *
 * For each slot whose `key` exists in `cancelledSlots`, sets `cancelled: true`
 * and attaches the cancellation info. Slots without a matching key get `cancelled: false`.
 *
 * Note: This performs a shallow merge — the original slot objects are mutated.
 * The caller in `_fetchTimetable` already works on freshly-created slot objects,
 * so this matches the existing behaviour.
 *
 * @param {Array<{key: string}>} slots - Array of slot objects
 * @param {Object|null} cancelledSlots - Map of slot key → cancellation records,
 *   where each record maps instance timestamps to cancellation info.
 *   `null` or `undefined` means no cancellations.
 * @param {function} processCancelFn - Function `(slot, cancelRecord) => void` that
 *   applies cancellation logic (time-based instance matching) to a single slot.
 * @returns {Array} The same slots array with cancellation flags applied
 */
export function mergeCancelledSlots(slots, cancelledSlots, processCancelFn) {
  slots.forEach(slot => {
    slot.cancelled = false;
    if (cancelledSlots && cancelledSlots[slot.key]) {
      processCancelFn(slot, cancelledSlots[slot.key]);
    }
  });
  return slots;
}
