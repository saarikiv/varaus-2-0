/**
 * Sample slot fixture data for tests.
 * Represents sauna time slots in a Finnish sauna reservation system.
 *
 * Slot shape: { key, day (1-7), start (ms from midnight), end (ms from midnight),
 *               blocked, reserver, cancelled, cancelInfo }
 */

// Helper: hours and minutes to milliseconds from midnight
const hm = (h, m = 0) => (h * 60 + m) * 60 * 1000;

export const sampleSlots = [
  {
    key: 'slot-ma-17',
    day: 1, // maanantai
    start: hm(17, 0),
    end: hm(19, 0),
    blocked: false,
    reserver: '',
    cancelled: false,
    cancelInfo: null
  },
  {
    key: 'slot-ti-18',
    day: 2, // tiistai
    start: hm(18, 0),
    end: hm(20, 0),
    blocked: false,
    reserver: '',
    cancelled: false,
    cancelInfo: null
  },
  {
    key: 'slot-ke-16',
    day: 3, // keskiviikko
    start: hm(16, 30),
    end: hm(18, 30),
    blocked: false,
    reserver: '',
    cancelled: false,
    cancelInfo: null
  },
  {
    key: 'slot-to-19',
    day: 4, // torstai
    start: hm(19, 0),
    end: hm(21, 0),
    blocked: true,
    reserver: 'Matti Virtanen',
    cancelled: false,
    cancelInfo: null
  },
  {
    key: 'slot-pe-17',
    day: 5, // perjantai
    start: hm(17, 0),
    end: hm(19, 0),
    blocked: false,
    reserver: '',
    cancelled: true,
    cancelInfo: { instance: Date.now(), reason: 'Huoltotauko' }
  },
  {
    key: 'slot-la-10',
    day: 6, // lauantai
    start: hm(10, 0),
    end: hm(12, 0),
    blocked: false,
    reserver: '',
    cancelled: false,
    cancelInfo: null
  },
  {
    key: 'slot-su-14',
    day: 7, // sunnuntai
    start: hm(14, 0),
    end: hm(16, 0),
    blocked: false,
    reserver: '',
    cancelled: false,
    cancelInfo: null
  }
];

/** Unsorted slots for testing sort invariants */
export const unsortedSlots = [
  { key: 'slot-c', day: 1, start: hm(19, 0), end: hm(21, 0), blocked: false, reserver: '', cancelled: false, cancelInfo: null },
  { key: 'slot-a', day: 1, start: hm(10, 0), end: hm(12, 0), blocked: false, reserver: '', cancelled: false, cancelInfo: null },
  { key: 'slot-b', day: 1, start: hm(14, 0), end: hm(16, 0), blocked: false, reserver: '', cancelled: false, cancelInfo: null }
];

/** Cancelled slots map (keyed by slot key) for testing cancelled slot marking */
export const cancelledSlotsMap = {
  'slot-pe-17': { instance: 1700000000000, reason: 'Huoltotauko' },
  'slot-su-14': { instance: 1700100000000, reason: 'Juhlapyhä' }
};

export { hm };
