import { expect } from 'chai';
import fc from 'fast-check';

describe('Test infrastructure', () => {
  it('should have JSDOM configured with document', () => {
    expect(global.document).to.exist;
    expect(global.document.querySelector('#root')).to.exist;
  });

  it('should have window and navigator globals', () => {
    expect(global.window).to.exist;
    expect(global.navigator).to.exist;
  });

  it('should support fast-check property testing', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      })
    );
  });
});
