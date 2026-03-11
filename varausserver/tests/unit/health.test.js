/**
 * Unit tests for GET /health endpoint.
 */

const express = require('express');
const http = require('http');
const { createMockFirebase } = require('../mocks/firebase');

let app, mockFirebase, JPS;

function createTestApp() {
  mockFirebase = createMockFirebase();
  app = express();

  JPS = {
    app,
    firebase: mockFirebase,
  };

  // Register the health endpoint (same logic as server.js)
  JPS.app.get('/health', (req, res) => {
    const health = { status: 'ok' };

    JPS.firebase.database().ref('/').once('value')
      .then(() => {
        health.firebase = 'connected';
        res.status(200).json(health);
      })
      .catch((err) => {
        health.firebase = 'error';
        health.firebaseError = err.message;
        res.status(200).json(health);
      });
  });

  return JPS;
}

function getRequest(app, path) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'GET',
      };

      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          server.close();
          let parsed;
          try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
          resolve({ status: response.statusCode, body: parsed });
        });
      });

      request.end();
    });
  });
}

describe('GET /health', () => {
  beforeEach(() => {
    createTestApp();
    mockFirebase._reset();
  });

  test('returns 200 with status ok and firebase connected', async () => {
    const response = await getRequest(app, '/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.firebase).toBe('connected');
  });

  test('returns 200 with firebase error when database read fails', async () => {
    // Override the mock database to simulate a failure
    const origDatabase = mockFirebase.database;
    mockFirebase.database = () => ({
      ref() {
        return {
          once() {
            return Promise.reject(new Error('Connection refused'));
          }
        };
      }
    });

    const response = await getRequest(app, '/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.firebase).toBe('error');
    expect(response.body.firebaseError).toBe('Connection refused');

    // Restore
    mockFirebase.database = origDatabase;
  });

  test('does not require authentication', async () => {
    // No auth headers or tokens — should still succeed
    const response = await getRequest(app, '/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
