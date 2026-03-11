/**
 * Sample booking fixture data for tests.
 * Represents sauna slot bookings in the reservation system.
 *
 * Booking shape (by slot): { instance (timestamp key), reservations,
 *   participants: [{ key, name, transactionReference }] }
 */

const now = Date.now();
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;

/** Future booking instance — should be retained after filtering */
export const futureBooking = {
  instance: String(now + ONE_DAY),
  reservations: 2,
  participants: [
    { key: 'uid-matti', name: 'Matti Virtanen', transactionReference: 'tx-001' },
    { key: 'uid-liisa', name: 'Liisa Korhonen', transactionReference: 'tx-002' }
  ]
};

/** Past booking instance — should be excluded after filtering */
export const pastBooking = {
  instance: String(now - ONE_DAY),
  reservations: 1,
  participants: [
    { key: 'uid-matti', name: 'Matti Virtanen', transactionReference: 'tx-003' }
  ]
};

/** A booking happening right now (edge case) */
export const currentBooking = {
  instance: String(now - ONE_HOUR),
  reservations: 1,
  participants: [
    { key: 'uid-anna', name: 'Anna Mäkinen', transactionReference: 'tx-004' }
  ]
};

/** Collection of bookings for a single slot */
export const slotBookings = [futureBooking, pastBooking, currentBooking];

/** User bookings (by user) — items from /bookingsbyuser/{uid} */
export const userBookings = {
  'uid-matti': [
    { item: String(now + ONE_DAY), txRef: 'tx-001' },
    { item: String(now - ONE_DAY), txRef: 'tx-003' }
  ],
  'uid-liisa': [
    { item: String(now + ONE_DAY), txRef: 'tx-002' }
  ],
  'uid-anna': [
    { item: String(now - ONE_HOUR), txRef: 'tx-004' }
  ]
};

export const TEST_UID = 'uid-matti';
