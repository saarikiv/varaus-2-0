// Feature: varaus, Property 12: Finnish day name formatting
// Validates: Requirement 22.3

import { expect } from 'chai';
import fc from 'fast-check';
import { getDayStr } from '../../src/dev/helpers/timeHelper.js';

const FINNISH_WEEKDAYS = [
  'sunnuntai',   // 0 = Sunday
  'maanantai',   // 1 = Monday
  'tiistai',     // 2 = Tuesday
  'keskiviikko', // 3 = Wednesday
  'torstai',     // 4 = Thursday
  'perjantai',   // 5 = Friday
  'lauantai'     // 6 = Saturday
];

describe('Property 12: Finnish day name formatting', function () {

  it('output starts with a valid Finnish weekday name followed by D.M.YYYY', function () {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('1970-01-01'), max: new Date('2099-12-31') }).filter((d) => !isNaN(d.getTime())),
        (date) => {
          const result = getDayStr(date);

          // Should start with one of the 7 Finnish weekday names
          const startsWithFinnish = FINNISH_WEEKDAYS.some((name) => result.startsWith(name));
          expect(startsWithFinnish, `"${result}" should start with a Finnish weekday name`).to.be.true;

          // The weekday name should match the actual day of the week
          const expectedName = FINNISH_WEEKDAYS[date.getDay()];
          expect(result.startsWith(expectedName),
            `Expected "${expectedName}" for day ${date.getDay()}, got "${result}"`
          ).to.be.true;

          // After the weekday name and space, the date portion should match D.M.YYYY
          const datePortion = result.slice(expectedName.length + 1);
          expect(datePortion).to.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/,
            `Date portion "${datePortion}" should match D.M.YYYY`);

          // The date values should match the input Date
          const [d, m, y] = datePortion.split('.').map(Number);
          expect(d).to.equal(date.getDate());
          expect(m).to.equal(date.getMonth() + 1);
          expect(y).to.equal(date.getFullYear());
        }
      ),
      { numRuns: 100 }
    );
  });

});
