/**
 * Property-based tests for timeHelper functions.
 * Feature: varausserver, Properties 1-3
 */

const fc = require('fast-check');
const timeHelper = require('../../src/helpers/timeHelper');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('timeHelper property-based tests', () => {

  /**
   * Feature: varausserver, Property 1: End-of-day time shift invariant
   * For any timestamp, shiftUntilEndOfDayMs(timestamp) should return a timestamp
   * on the same calendar day with hours=23, minutes=59, seconds=59, milliseconds=999,
   * and result >= input.
   *
   * **Validates: Requirements 13.2, 6.3**
   */
  test('Property 1: shiftUntilEndOfDayMs returns end-of-day on same calendar day and result >= input', () => {
    fc.assert(
      fc.property(
        // Generate timestamps in a reasonable range (2000-01-01 to 2040-01-01)
        fc.integer({ min: 946684800000, max: 2208988800000 }),
        (timestamp) => {
          const result = timeHelper.shiftUntilEndOfDayMs(timestamp);
          const inputDate = new Date(timestamp);
          const resultDate = new Date(result);

          // Same calendar day
          expect(resultDate.getFullYear()).toBe(inputDate.getFullYear());
          expect(resultDate.getMonth()).toBe(inputDate.getMonth());
          expect(resultDate.getDate()).toBe(inputDate.getDate());

          // End of day values
          expect(resultDate.getHours()).toBe(23);
          expect(resultDate.getMinutes()).toBe(59);
          expect(resultDate.getSeconds()).toBe(59);
          expect(resultDate.getMilliseconds()).toBe(999);

          // Result >= input
          expect(result).toBeGreaterThanOrEqual(timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: varausserver, Property 2: Slot time calculation correctness
   * For any valid weeksForward (non-negative integer), dayNumber (1-7),
   * timeOfStart (ms within a day), getSlotTimeLocal should return a Date
   * whose day-of-week matches dayNumber and whose time-of-day component
   * equals timeOfStart. DST transitions can shift the result by ±1 hour,
   * which may also shift the day when timeOfStart is near midnight.
   *
   * We test with timeOfStart in the safe range [1h, 22h] to avoid DST
   * boundary effects that can legitimately shift the calendar day.
   *
   * **Validates: Requirements 13.1**
   */
  test('Property 2: getSlotTimeLocal returns correct day-of-week and time-of-day', () => {
    const ONE_HOUR = 3600000;
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 52 }),                          // weeksForward
        fc.integer({ min: ONE_HOUR, max: MS_PER_DAY - ONE_HOUR - 1 }), // timeOfStart (safe range)
        fc.integer({ min: 1, max: 7 }),                           // dayNumber (1=Mon, 7=Sun)
        (weeksForward, timeOfStart, dayNumber) => {
          const result = timeHelper.getSlotTimeLocal(weeksForward, timeOfStart, dayNumber);

          // Check day-of-week: JS getDay() returns 0=Sun, 1=Mon...6=Sat
          // dayNumber uses 1=Mon...7=Sun
          let jsDay = result.getDay();
          jsDay = jsDay === 0 ? 7 : jsDay;
          expect(jsDay).toBe(dayNumber);

          // Check time-of-day component matches timeOfStart (within DST tolerance)
          const midnight = new Date(result);
          midnight.setHours(0, 0, 0, 0);
          const timeComponent = result.getTime() - midnight.getTime();
          const diff = Math.abs(timeComponent - timeOfStart);
          expect(diff).toBeLessThanOrEqual(ONE_HOUR);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: varausserver, Property 3: Date formatting structure
   * For any valid Date, getDayStr(date) should return "D.M.YYYY" where
   * parsing back yields same day, month, year.
   *
   * **Validates: Requirements 13.3**
   */
  test('Property 3: getDayStr returns D.M.YYYY that round-trips correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2040-01-01') })
          .filter(d => !isNaN(d.getTime())),
        (date) => {
          const result = timeHelper.getDayStr(date);

          // Should match D.M.YYYY pattern
          expect(result).toMatch(/^\d{1,2}\.\d{1,2}\.\d{4}$/);

          // Parse back and verify
          const parts = result.split('.');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);

          expect(day).toBe(date.getDate());
          expect(month).toBe(date.getMonth() + 1);
          expect(year).toBe(date.getFullYear());
        }
      ),
      { numRuns: 100 }
    );
  });
});
