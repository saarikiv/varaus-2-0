/**
 * Sample transaction fixture data for tests.
 * Represents purchase transactions in the sauna reservation system.
 *
 * Transaction shape: { type, expires, unusedtimes, usetimes, shopItem,
 *   shopItemKey, oneTime, paymentReceived, details: { transaction: { paymentInstrumentType } } }
 */

const now = Date.now();
const ONE_DAY = 86400000;

/** Valid count transaction — 10 sauna visits, 7 remaining */
export const validCountTransaction = {
  type: 'count',
  expires: now + 180 * ONE_DAY,
  unusedtimes: 7,
  usetimes: 10,
  shopItem: '10-kertaa',
  shopItemKey: '10-kertaa',
  oneTime: false,
  paymentReceived: true,
  details: { transaction: { paymentInstrumentType: 'invoice' } }
};

/** Valid time-based transaction — 30-day sauna pass */
export const validTimeTransaction = {
  type: 'time',
  expires: now + 30 * ONE_DAY,
  unusedtimes: 0,
  usetimes: 0,
  shopItem: 'Kuukausikortti',
  shopItemKey: 'kuukausikortti',
  oneTime: false,
  paymentReceived: true,
  details: { transaction: { paymentInstrumentType: 'cash' } }
};

/** Expired count transaction */
export const expiredCountTransaction = {
  type: 'count',
  expires: now - 10 * ONE_DAY,
  unusedtimes: 3,
  usetimes: 10,
  shopItem: '10-kertaa',
  shopItemKey: '10-kertaa',
  oneTime: false,
  paymentReceived: true,
  details: { transaction: { paymentInstrumentType: 'invoice' } }
};

/** Expired time transaction */
export const expiredTimeTransaction = {
  type: 'time',
  expires: now - 5 * ONE_DAY,
  unusedtimes: 0,
  usetimes: 0,
  shopItem: 'Kuukausikortti',
  shopItemKey: 'kuukausikortti',
  oneTime: false,
  paymentReceived: true,
  details: { transaction: { paymentInstrumentType: 'invoice' } }
};

/** Special one-time transaction (e.g., a single event pass) */
export const specialTransaction = {
  type: 'special',
  expires: now + 7 * ONE_DAY,
  unusedtimes: 1,
  usetimes: 1,
  shopItem: 'Juhannussauna',
  shopItemKey: 'juhannussauna',
  oneTime: true,
  paymentReceived: true,
  details: { transaction: { paymentInstrumentType: 'cash' } }
};

/** Unpaid delayed transaction */
export const unpaidTransaction = {
  type: 'count',
  expires: now + 90 * ONE_DAY,
  unusedtimes: 5,
  usetimes: 5,
  shopItem: '5-kertaa',
  shopItemKey: '5-kertaa',
  oneTime: false,
  paymentReceived: false,
  details: { transaction: { paymentInstrumentType: 'invoice' } }
};

/** All sample transactions for convenience */
export const allTransactions = [
  validCountTransaction,
  validTimeTransaction,
  expiredCountTransaction,
  expiredTimeTransaction,
  specialTransaction,
  unpaidTransaction
];
