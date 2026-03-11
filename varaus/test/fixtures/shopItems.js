/**
 * Sample shop item fixture data for tests.
 * Represents purchasable products in the sauna reservation system.
 *
 * ShopItem shape: { key, title, desc, type, price, taxpercent, taxamount,
 *   beforetax, locked, oneTime, usetimes, usedays, expiresAfterDays }
 */

/** Count-based: 10 sauna visits */
export const countItem = {
  key: '10-kertaa',
  title: '10-kertaa',
  desc: '10 saunakertaa',
  type: 'count',
  price: 50.00,
  taxpercent: 24.00,
  taxamount: 9.68,
  beforetax: 40.32,
  locked: false,
  oneTime: false,
  usetimes: 10,
  usedays: 0,
  expiresAfterDays: 365
};

/** Count-based: 5 sauna visits */
export const smallCountItem = {
  key: '5-kertaa',
  title: '5-kertaa',
  desc: '5 saunakertaa',
  type: 'count',
  price: 30.00,
  taxpercent: 24.00,
  taxamount: 5.81,
  beforetax: 24.19,
  locked: false,
  oneTime: false,
  usetimes: 5,
  usedays: 0,
  expiresAfterDays: 180
};

/** Time-based: monthly sauna pass */
export const timeItem = {
  key: 'kuukausikortti',
  title: 'Kuukausikortti',
  desc: 'Rajaton saunominen 30 päivää',
  type: 'time',
  price: 80.00,
  taxpercent: 24.00,
  taxamount: 15.48,
  beforetax: 64.52,
  locked: false,
  oneTime: false,
  usetimes: 0,
  usedays: 30,
  expiresAfterDays: 30
};

/** Special one-time: midsummer sauna event */
export const specialItem = {
  key: 'juhannussauna',
  title: 'Juhannussauna',
  desc: 'Juhannusaaton erikoissauna',
  type: 'special',
  price: 15.00,
  taxpercent: 24.00,
  taxamount: 2.90,
  beforetax: 12.10,
  locked: false,
  oneTime: true,
  usetimes: 1,
  usedays: 0,
  expiresAfterDays: 1
};

/** Locked item — should be excluded from user-facing shop */
export const lockedItem = {
  key: 'vuosikortti',
  title: 'Vuosikortti',
  desc: 'Rajaton saunominen 365 päivää',
  type: 'time',
  price: 500.00,
  taxpercent: 24.00,
  taxamount: 96.77,
  beforetax: 403.23,
  locked: true,
  oneTime: false,
  usetimes: 0,
  usedays: 365,
  expiresAfterDays: 365
};

/** All sample shop items */
export const allShopItems = [countItem, smallCountItem, timeItem, specialItem, lockedItem];
