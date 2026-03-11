/**
 * Unit tests for POST /cancelSlot happy path.
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

  // Register the cancelSlot endpoint (it does its own auth inline)
  require('../../src/post/postCancelSlot').setApp(JPS);

  return JPS;
}

function postRequest(app, path, body) {
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

describe('POST /cancelSlot', () => {
  beforeEach(() => {
    createTestJPS();
    mockFirebase._reset();
    mockMailer._reset();
  });

  test('happy path: cancel count-based booking removes from both paths and increments unusedtimes', async () => {
    const userUid = 'canceluser1';
    const slotKey = 'slot_tue_19';
    const bookingTime = 1700000000000;
    const txRef = 1699000000000;

    // Seed the database with user, bookings in both paths, and transaction
    mockFirebase._seed({
      users: {
        [userUid]: {
          email: 'cancel@example.com',
          firstname: 'Cancel',
          lastname: 'User',
        }
      },
      bookingsbyslot: {
        [slotKey]: {
          [String(bookingTime)]: {
            [userUid]: {
              user: 'Cancel User',
              transactionReference: txRef,
              slotTime: bookingTime,
            }
          }
        }
      },
      bookingsbyuser: {
        [userUid]: {
          [slotKey]: {
            [String(bookingTime)]: {
              transactionReference: txRef,
              slotTime: bookingTime,
            }
          }
        }
      },
      transactions: {
        [userUid]: {
          [String(txRef)]: {
            unusedtimes: 4,
            expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
            type: 'count',
          }
        }
      }
    });

    const requestBody = {
      user: userUid,
      slotInfo: { key: slotKey },
      cancelItem: bookingTime,
      transactionReference: txRef,
      timezoneOffset: -120,
    };

    const response = await postRequest(app, '/cancelSlot', requestBody);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cancellation COUNT was successful.');

    const store = mockFirebase._getStore();

    // Verify booking removed from bookingsbyuser
    expect(
      store.bookingsbyuser?.[userUid]?.[slotKey]?.[String(bookingTime)]
    ).toBeUndefined();

    // Verify booking removed from bookingsbyslot
    expect(
      store.bookingsbyslot?.[slotKey]?.[String(bookingTime)]?.[userUid]
    ).toBeUndefined();

    // Verify unusedtimes was incremented
    expect(store.transactions[userUid][String(txRef)].unusedtimes).toBe(5);

    // Verify cancellation email was sent
    const messages = mockMailer._getSentMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('cancellationCount');
    expect(messages[0].sendTo).toBe('cancel@example.com');
  });

  test('happy path: cancel time-based booking (txRef=0) removes bookings without touching transactions', async () => {
    const userUid = 'timeuser1';
    const slotKey = 'slot_fri_17';
    const bookingTime = 1700500000000;

    mockFirebase._seed({
      users: {
        [userUid]: {
          email: 'time@example.com',
          firstname: 'Time',
          lastname: 'User',
        }
      },
      bookingsbyslot: {
        [slotKey]: {
          [String(bookingTime)]: {
            [userUid]: {
              user: 'Time User',
              transactionReference: 0,
              slotTime: bookingTime,
            }
          }
        }
      },
      bookingsbyuser: {
        [userUid]: {
          [slotKey]: {
            [String(bookingTime)]: {
              transactionReference: 0,
              slotTime: bookingTime,
            }
          }
        }
      },
    });

    const requestBody = {
      user: userUid,
      slotInfo: { key: slotKey },
      cancelItem: bookingTime,
      transactionReference: 0,
      timezoneOffset: -120,
    };

    const response = await postRequest(app, '/cancelSlot', requestBody);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cancellation TIME was successful.');

    const store = mockFirebase._getStore();

    // Verify booking removed from both paths
    expect(
      store.bookingsbyuser?.[userUid]?.[slotKey]?.[String(bookingTime)]
    ).toBeUndefined();
    expect(
      store.bookingsbyslot?.[slotKey]?.[String(bookingTime)]?.[userUid]
    ).toBeUndefined();

    // Verify time cancellation email was sent
    const messages = mockMailer._getSentMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].type).toBe('cancellationTime');
  });
});
