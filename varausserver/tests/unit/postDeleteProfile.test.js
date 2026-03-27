/**
 * Unit tests for POST /deleteProfile endpoint.
 * Uses mock Firebase layer and mock mailer.
 */

const express = require('express');
const { createMockFirebase } = require('../mocks/firebase');
const { createMockMailer } = require('../mocks/mailgun');

let app, mockFirebase, mockMailer, JPS;
let deletedAuthUsers, emailCalls;

function createTestJPS() {
  mockFirebase = createMockFirebase();
  mockMailer = createMockMailer();

  deletedAuthUsers = [];
  emailCalls = [];

  app = express();
  app.use(express.json());

  // Add deleteUser to mock firebase auth
  const originalAuth = mockFirebase.auth.bind(mockFirebase);
  mockFirebase.auth = () => {
    const authObj = originalAuth();
    authObj.deleteUser = (uid) => {
      deletedAuthUsers.push(uid);
      return Promise.resolve();
    };
    return authObj;
  };

  // Add sendDeletionConfirmation to mock mailer
  mockMailer.sendDeletionConfirmation = (email, date) => {
    emailCalls.push({ email, date });
  };

  JPS = {
    app,
    firebase: mockFirebase,
    mailer: mockMailer,
  };

  // Auth middleware that sets req.auth from a header
  JPS.authMiddleware = (req, res, next) => {
    const uid = req.headers['x-test-uid'];
    const email = req.headers['x-test-email'] || 'test@example.com';
    if (!uid) {
      return res.status(401).json({ error: 'No auth' });
    }
    req.auth = {
      uid,
      user: { email },
    };
    next();
  };

  require('../../src/post/postDeleteProfile').setApp(JPS);

  return JPS;
}

function postRequest(app, path, body, headers = {}) {
  return new Promise((resolve) => {
    const http = require('http');
    const server = app.listen(0, () => {
      const port = server.address().port;
      const postData = JSON.stringify(body);
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers,
        },
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

      request.write(postData);
      request.end();
    });
  });
}

describe('POST /deleteProfile', () => {
  const uid = 'user123';
  const email = 'user@example.com';
  const authHeaders = { 'x-test-uid': uid, 'x-test-email': email };

  beforeEach(() => {
    createTestJPS();
    mockFirebase._reset();
    mockMailer._reset();
    deletedAuthUsers = [];
    emailCalls = [];
  });

  test('returns 409 when user has active bookings', async () => {
    const now = Date.now();
    const slotKey = 'slot_mon_18';

    mockFirebase._seed({
      bookingsbyuser: {
        [uid]: {
          [slotKey]: {
            booking1: { slotTime: now + 60000 },
          },
        },
      },
      slots: {
        [slotKey]: { start: 0, end: 3600000 },
      },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/active bookings/i);
  });

  test('deletes all four DB paths when no active bookings', async () => {
    mockFirebase._seed({
      users: { [uid]: { email, firstname: 'Test' } },
      bookingsbyuser: { [uid]: {} },
      transactions: { [uid]: { tx1: { amount: 10 } } },
      specialUsers: { [uid]: { admin: true } },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    expect(response.status).toBe(200);

    const store = mockFirebase._getStore();
    expect(store.users?.[uid]).toBeUndefined();
    expect(store.bookingsbyuser?.[uid]).toBeUndefined();
    expect(store.transactions?.[uid]).toBeUndefined();
    expect(store.specialUsers?.[uid]).toBeUndefined();
  });

  test('returns 500 when a deletion operation fails', async () => {
    // Seed with no active bookings
    mockFirebase._seed({
      bookingsbyuser: { [uid]: {} },
    });

    // Make the database ref().remove() throw for /users path
    const originalRef = mockFirebase.database().ref.bind(mockFirebase.database());
    mockFirebase.database = () => ({
      ref(path) {
        const r = originalRef(path);
        if (path === '/users/' + uid) {
          r.remove = () => Promise.reject(new Error('DB write failed'));
        }
        return r;
      },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/failed/i);
  });

  test('sends email before deleting Auth account', async () => {
    let emailSentBeforeAuthDelete = false;

    // Track ordering: email call vs auth delete
    mockMailer.sendDeletionConfirmation = (em, date) => {
      emailCalls.push({ email: em, date });
      // At this point, auth should NOT have been deleted yet
      emailSentBeforeAuthDelete = deletedAuthUsers.length === 0;
    };

    mockFirebase._seed({
      users: { [uid]: { email } },
      bookingsbyuser: { [uid]: {} },
      transactions: { [uid]: {} },
      specialUsers: { [uid]: {} },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    expect(response.status).toBe(200);
    expect(emailCalls.length).toBe(1);
    expect(emailCalls[0].email).toBe(email);
    expect(deletedAuthUsers).toContain(uid);
    expect(emailSentBeforeAuthDelete).toBe(true);
  });

  test('continues deletion if email sending fails', async () => {
    mockMailer.sendDeletionConfirmation = () => {
      throw new Error('Mailgun down');
    };

    mockFirebase._seed({
      users: { [uid]: { email } },
      bookingsbyuser: { [uid]: {} },
      transactions: { [uid]: {} },
      specialUsers: { [uid]: {} },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    // Should still succeed despite email failure
    expect(response.status).toBe(200);
    // Auth account should still be deleted
    expect(deletedAuthUsers).toContain(uid);
  });

  test('returns 200 on successful deletion', async () => {
    mockFirebase._seed({
      users: { [uid]: { email, firstname: 'Test' } },
      bookingsbyuser: { [uid]: {} },
      transactions: { [uid]: { tx1: { amount: 5 } } },
      specialUsers: { [uid]: { instructor: true } },
    });

    const response = await postRequest(app, '/deleteProfile', {}, authHeaders);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/deleted/i);
    // Verify auth account was deleted
    expect(deletedAuthUsers).toEqual([uid]);
  });
});
