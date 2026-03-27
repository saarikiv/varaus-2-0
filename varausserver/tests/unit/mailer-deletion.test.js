/**
 * Unit tests for sendDeletionConfirmation in mailer.js
 * Requirements: 4.1, 4.2, 4.3
 */

let mailer;
let mockSend;
let mockMessages;

beforeEach(() => {
  jest.resetModules();

  // Set up the mock send function that captures calls
  mockSend = jest.fn((data, cb) => {
    cb(null, { id: 'mock-id', message: 'Queued' });
  });
  mockMessages = jest.fn(() => ({ send: mockSend }));

  // Mock mailgun-js to return a factory that produces our mock
  jest.mock('mailgun-js', () => {
    return function () {
      return { messages: mockMessages };
    };
  });

  // Require a fresh copy of the mailer module each time
  mailer = require('../../src/helpers/mailer');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendDeletionConfirmation', () => {
  test('sends email with correct subject and content', () => {
    // Initialize the mailer so JPSM.initialized = true
    mailer.initializeMail({});

    const email = 'user@example.com';
    const deletionDate = new Date('2025-01-15');

    mailer.sendDeletionConfirmation(email, deletionDate);

    expect(mockMessages).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledTimes(1);

    const sentData = mockSend.mock.calls[0][0];
    expect(sentData.to).toBe(email);
    expect(sentData.subject).toBe('Profiilin poistovahvistus - Hakolahdentie 2');
    expect(sentData.html).toContain(email);
    expect(sentData.html).toContain(deletionDate.toLocaleDateString('fi-FI'));
    expect(sentData.from).toBeDefined();
  });

  test('does nothing when mailer is not initialized', () => {
    // Do NOT call initializeMail — JPSM.initialized remains false
    mailer.sendDeletionConfirmation('user@example.com', new Date());

    // Mailgun messages().send() should never be called
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('logs error but does not throw on Mailgun failure', () => {
    mailer.initializeMail({});

    // Make send invoke callback with an error
    mockSend.mockImplementation((data, cb) => {
      cb(new Error('Mailgun API failure'), null);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Should not throw
    expect(() => {
      mailer.sendDeletionConfirmation('user@example.com', new Date());
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    const errorArgs = consoleSpy.mock.calls[0];
    expect(errorArgs[0]).toMatch(/MAILGUN.*error/i);

    consoleSpy.mockRestore();
  });
});
