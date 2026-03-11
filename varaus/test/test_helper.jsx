const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true
});

const { window } = jsdom;

// Assign JSDOM globals that don't conflict with Node.js built-ins
global.window = window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Suppress React 18 act() warnings in test output
global.IS_REACT_ACT_ENVIRONMENT = true;
