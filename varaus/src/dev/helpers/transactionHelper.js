/**
 * Pure helper functions for transaction processing.
 *
 * Extracted from the user action for testability.
 * Handles transaction categorization, credit calculation, and expiry calculation.
 */

/**
 * Build a transaction detail object from a raw Firebase transaction record.
 *
 * @param {string} purchasetime - The transaction timestamp key.
 * @param {Object} raw - Raw transaction from Firebase.
 * @returns {Object} Normalized transaction detail.
 */
function buildTransactionDetail(purchasetime, raw) {
  const detail = {
    purchasetime,
    type: raw.type,
    expires: raw.expires,
    paymentInstrumentType: raw.details.transaction.paymentInstrumentType,
    shopItem: raw.shopItem,
    shopItemKey: raw.shopItemKey,
    oneTime: raw.oneTime || false
  };
  if (raw.type === 'count') {
    detail.unusedtimes = raw.unusedtimes;
    detail.usetimes = raw.usetimes;
  }
  return detail;
}

/**
 * Categorize and summarize a set of transactions.
 *
 * Produces the same TransactionSummary shape used by the Redux store:
 * - `time`: latest expiry among non-expired time transactions (0 if none)
 * - `count`: sum of unusedtimes from non-expired count transactions
 * - `firstexpire`: earliest count expiry that still has remaining uses (0 if none)
 * - `details.valid`: non-expired transaction details sorted by expiry ascending
 * - `details.expired`: expired transaction details sorted by expiry ascending
 * - `details.oneTime`: shopItemKeys of one-time transactions
 *
 * Requirements: 12.2 (categorize), 12.3 (count credits), 12.4 (time expiry)
 *
 * @param {Object|null} allTransactions - Raw transactions object keyed by timestamp,
 *   as returned from Firebase `/transactions/{uid}`. Each value has at least
 *   `{ type, expires, unusedtimes, usetimes, shopItem, shopItemKey, oneTime,
 *     details: { transaction: { paymentInstrumentType } } }`.
 * @param {number} now - Current timestamp in milliseconds (Date.now()).
 * @returns {{ time: number, count: number, firstexpire: number,
 *   details: { valid: Object[], expired: Object[], oneTime: string[] } }}
 */
export function categorizeTransactions(allTransactions, now) {
  const result = {
    time: 0,
    count: 0,
    firstexpire: 0,
    details: {
      valid: [],
      expired: [],
      oneTime: []
    }
  };

  if (!allTransactions) return result;

  for (const key in allTransactions) {
    const raw = allTransactions[key];
    const detail = buildTransactionDetail(key, raw);

    switch (raw.type) {
      case 'time':
        if (raw.expires > now) {
          if (raw.expires > result.time) {
            result.time = raw.expires;
          }
        }
        break;
      case 'count':
        if (raw.expires > now) {
          result.count += raw.unusedtimes;
          if (raw.expires < result.firstexpire || result.firstexpire === 0) {
            if (raw.unusedtimes > 0) {
              result.firstexpire = raw.expires;
            }
          }
        }
        break;
      default:
        // special or unknown types — no credit/expiry calculation
        break;
    }

    if (detail.expires > now) {
      result.details.valid.push(detail);
    } else {
      result.details.expired.push(detail);
    }

    if (detail.oneTime) {
      result.details.oneTime.push(detail.shopItemKey);
    }
  }

  result.details.valid.sort((a, b) => a.expires - b.expires);
  result.details.expired.sort((a, b) => a.expires - b.expires);

  return result;
}
