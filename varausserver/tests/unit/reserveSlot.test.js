/**
 * Unit tests for POST /reserveSlot happy path.
 * Uses mock Firebase layer and mock mailer.
 */

const express = require('express');
const { createMockFirebase } = require('../mocks/firebase');
const { createMockMailer } = require('../mocks/mailgun');
const timeHelper = require('../../src/helpers/timeHelper');

let app, mockFirebase, mockMailer, JPS;

function createTestJPS() {
  mockFirebase = createMockFirebase();
  mockMailer = createMockMailer();

  app = express();
  app.use(express.json());

  JPS = {
    app,
    firebase: mockFirebase,
    mailer: mockMailer,
    timeHelper,
  };

  // Create a simple auth middleware that trusts req.body.user as the token
  JPS.authMiddleware = (req, res, next) => {
    const token = req.body.user || req.body.current_user;
    if (!token) {
      return res.status(500).json({ error: 'No authentication token provided.' });
    }
    return mockFirebase.auth().verifyIdToken(token)
      .then(decoded => {
        const uid = decoded.uid || decoded.sub;
        return mockFirebase.database().ref('/users/' + uid).once('value')
          .then(snapshot => {
            if (snapshot.val() == null) {
              throw new Error('User record does not exist in the database: ' + uid);
            }
            const user = snapshot.val();
            user.key = snapshot.key;
            req.auth = { uid, user };
            next();
          });
      })
      .catch(err => {
        res.status(500).json({ error: 'Authentication failed: ' + String(err) });
      });
  };

  // Register the reserveSlot endpoint
  require('../../src/post/postReserveSlot').setApp(JPS);

  return JPS;
}

/**
 * Helper to make a POST request using the Express app directly (no HTTP server needed).
 */
function postRequest(app, path, body) {
  return new Promise((resolve) => {
    const req = {
      method: 'POST',
      url: path,
      headers: { 'content-type': 'application/json' },
      body,
    };

    const res = {
      _status: 200,
      _body: null,
      status(code) { this._status = code; return this; },
      json(data) { this._body = data; return this; },
      jsonp(data) { this._body = data; return this; },
      end() { return this; },
    };

    // Use supertest-like approach: pipe through Express
    // Actually, let's just use a lightweight approach with app.handle
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

describe('POST /reserveSlot', () => {
  beforeEach(() => {
    createTestJPS();
    mockFirebase._reset();
    mockMailer._reset();
  });

  test('happy path: user with valid count-based transaction books a slot', async () => {
    const userUid = 'testuser123';
    const now = Date.now();
    const futureExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30 days from now

    // Seed the mock database
    mockFirebase._seed({
      users: {
        [userUid]: {
          email: 'test@example.com',
          firstname: 'Test',
          lastname: 'User',
        }
      },
      transactions: {
        [userUid]: {
          [String(now - 1000)]: {
            expires: futureExpiry,
            unusedtimes: 5,
            type: 'count',
            title: 'Sauna 10x',
          }
        }
      }
    });

    const requestBody = {
      user: userUid,
      slotInfo: {
        key: 'slot_monday_18',
        start: 64800000, // 18:00 in ms
        day: 1,          // Monday
      },
      weeksForward: 1,
      timezoneOffset: -120,
    };

    const response = await postRequest(app, '/reserveSlot', requestBody);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Booking done successfully');

    // Verify unusedtimes was decremented
    const store = mockFirebase._getStore();
    const txKey = String(now - 1000);
    expect(store.transactions[userUid][txKey].unusedtimes).toBe(4);

    // Verify booking was written to bookingsbyslot
    expect(store.bookingsbyslot).toBeDefined();
    expect(store.bookingsbyslot['slot_monday_18']).toBeDefined();

    // Verify booking was written to bookingsbyuser
    expect(store.bookingsbyuser).toBeDefined();
    expect(store.bookingsbyuser[userUid]).toBeDefined();

    // Verify confirmation email was sent
    const messages = mockMailer._getSentMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('confirmation');
    expect(messages[0].sendTo).toBe('test@example.com');
  });

  test('happy path: booking written to both bookingsbyslot and bookingsbyuser paths', async () => {
    const userUid = 'user456';
    const now = Date.now();
    const futureExpiry = now + 60 * 24 * 60 * 60 * 1000;

    mockFirebase._seed({
      users: {
        [userUid]: {
          email: 'user@example.com',
          firstname: 'Jane',
          lastname: 'Doe',
          alias: 'JD',
        }
      },
      transactions: {
        [userUid]: {
          '1000000': {
            expires: futureExpiry,
            unusedtimes: 3,
            type: 'count',
          }
        }
      }
    });

    const requestBody = {
      user: userUid,
      slotInfo: {
        key: 'slot_wed_20',
        start: 72000000, // 20:00 in ms
        day: 3,          // Wednesday
      },
      weeksForward: 0,
    };

    const response = await postRequest(app, '/reserveSlot', requestBody);
    expect(response.status).toBe(200);

    const store = mockFirebase._getStore();

    // Verify dual-write: both paths should have the booking
    const slotBookings = store.bookingsbyslot['slot_wed_20'];
    expect(slotBookings).toBeDefined();

    const userBookings = store.bookingsbyuser[userUid];
    expect(userBookings).toBeDefined();
    expect(userBookings['slot_wed_20']).toBeDefined();

    // Verify the user display name uses alias when available
    const bookingTimes = Object.keys(slotBookings);
    expect(bookingTimes.length).toBe(1);
    const bookingData = slotBookings[bookingTimes[0]][userUid];
    expect(bookingData.user).toBe('JD');
  });
});
