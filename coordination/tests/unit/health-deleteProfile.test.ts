import { expect } from 'chai';
import { MONITORED_BACKEND_ROUTES } from '../../src/health/index';

describe('Health check route registry', function () {
  it('includes /deleteProfile in monitored routes', function () {
    expect(MONITORED_BACKEND_ROUTES).to.include('/deleteProfile');
  });

  it('includes /health in monitored routes', function () {
    expect(MONITORED_BACKEND_ROUTES).to.include('/health');
  });
});
