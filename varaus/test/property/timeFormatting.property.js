// Feature: varaus, Property 11: Time formatting correctness
// Validates: Requirements 22.4, 22.6

import { expect } from 'chai';
import fc from 'fast-check';
import { getTimeStr, toMilliseconds, msToHHMM } from '../../src/dev/helpers/timeHelper.js';

describe('Property 11: Time formatting correctness', function () {

  it('getTimeStr returns HH:MM pattern for any valid Date', function () {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        (date) => {
          const result = getTimeStr(date);
          expect(result).to.match(/^\d{2}:\d{2}$/);
          const [hh, mm] = result.split(':').map(Number);
          expect(hh).to.be.at.least(0).and.at.most(23);
          expect(mm).to.be.at.least(0).and.at.most(59);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('toMilliseconds(msToHHMM(ms)) round-trips correctly for valid ms values', function () {
    // Generate ms values at minute precision within a valid day range
    // Max valid: 23h 59m = 23*3600000 + 59*60000 = 86340000
    const validMsArb = fc.integer({ min: 0, max: 23 * 60 + 59 }).map(
      (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return (hours * 3600000) + (minutes * 60000);
      }
    );

    fc.assert(
      fc.property(validMsArb, (ms) => {
        const hhmm = msToHHMM(ms);
        const roundTripped = toMilliseconds(hhmm);
        expect(roundTripped).to.equal(ms);
      }),
      { numRuns: 100 }
    );
  });

  it('toMilliseconds and msToHHMM round-trip from HHMM direction', function () {
    // Generate valid HHMM by combining hours (0-23) and minutes (0-59)
    const validHHMMArb = fc.tuple(
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 59 })
    ).map(([h, m]) => h * 100 + m);

    fc.assert(
      fc.property(validHHMMArb, (hhmm) => {
        const ms = toMilliseconds(hhmm);
        const roundTripped = msToHHMM(ms);
        expect(roundTripped).to.equal(hhmm);
      }),
      { numRuns: 100 }
    );
  });

});
