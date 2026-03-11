// Feature: varaus, Property 1: Route completeness and uniqueness
// Validates: Requirement 1.3

import { expect } from 'chai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_ROUTES = [
  '/',
  '/admin',
  '/info',
  '/shop',
  '/user',
  '/register',
  '/checkout',
  '/userProfile',
  '/forgotPassword',
  '/diagnostics',
  '/feedback',
  '/useroverview',
  '/lockeduser',
  '/tests'
];

// Read routes.jsx source to verify route definitions
const routesSource = readFileSync(
  resolve(process.cwd(), 'src/routes.jsx'),
  'utf-8'
);

describe('Property 1: Route completeness and uniqueness — routes.jsx', function () {

  it('defines exactly 14 required routes', function () {
    // **Validates: Requirement 1.3**
    // The index route handles "/" and the remaining 13 use path="name"
    // Count child Route components (those with index or path="name", excluding the parent layout route with path="/")
    const childRoutes = routesSource.match(/<Route\s+(?:index|path="(?!\/")[^"]*")[^>]*>/g);
    expect(childRoutes).to.not.be.null;
    expect(childRoutes).to.have.lengthOf(14);
  });

  it('contains the home route (index)', function () {
    // **Validates: Requirement 1.3**
    expect(routesSource).to.match(/<Route\s+index\s/);
  });

  REQUIRED_ROUTES.filter(r => r !== '/').forEach(function (route) {
    const routeName = route.slice(1); // strip leading /

    it(`contains route for ${route}`, function () {
      // **Validates: Requirement 1.3**
      const pattern = new RegExp(`path=["']${routeName}["']`);
      expect(routesSource).to.match(pattern);
    });
  });

  it('each route path appears exactly once', function () {
    // **Validates: Requirement 1.3**
    // Check index route appears once
    const indexMatches = routesSource.match(/<Route\s+index\s/g);
    expect(indexMatches).to.have.lengthOf(1);

    // Check each named route appears exactly once
    REQUIRED_ROUTES.filter(r => r !== '/').forEach(function (route) {
      const routeName = route.slice(1);
      const pattern = new RegExp(`path=["']${routeName}["']`, 'g');
      const matches = routesSource.match(pattern);
      expect(matches, `${route} should appear exactly once`).to.have.lengthOf(1);
    });
  });

  it('all routes are wrapped inside a Layout parent route', function () {
    // **Validates: Requirement 1.4**
    expect(routesSource).to.match(/<Route\s+path=["']\/["']\s+element=\{<Layout\s*\/>\}/);
  });
});
