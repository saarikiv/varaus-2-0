/**
 * Mock Mailgun helper for testing.
 * Captures all sent messages for assertion.
 */

function createMockMailer() {
  const sentMessages = [];

  return {
    sendConfirmation(sendTo, slotInfo, slotTime) {
      sentMessages.push({ type: 'confirmation', sendTo, slotInfo, slotTime });
    },
    sendCancellationCount(sendTo, slotInfo, slotTimeMs) {
      sentMessages.push({ type: 'cancellationCount', sendTo, slotInfo, slotTimeMs });
    },
    sendCancellationTime(sendTo, slotInfo, slotTimeMs) {
      sentMessages.push({ type: 'cancellationTime', sendTo, slotInfo, slotTimeMs });
    },
    sendReceipt(sendTo, trx, trxId) {
      sentMessages.push({ type: 'receipt', sendTo, trx, trxId });
    },
    sendThankyouForFeedback(user) {
      sentMessages.push({ type: 'thankyouForFeedback', user });
    },
    sendFeedback(user, feedback) {
      sentMessages.push({ type: 'feedback', user, feedback });
    },
    sendRegistration(user) {
      sentMessages.push({ type: 'registration', user });
    },
    sendNotifyDelayed(user, transaction) {
      sentMessages.push({ type: 'notifyDelayed', user, transaction });
    },
    initializeMail() {},
    /** Get all captured messages */
    _getSentMessages() {
      return sentMessages;
    },
    /** Reset captured messages */
    _reset() {
      sentMessages.length = 0;
    }
  };
}

module.exports = { createMockMailer };
