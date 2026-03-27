/**
 * Global firebase mock for testing action creators that depend on firebase.
 * Must be imported BEFORE any module that uses firebase at the module level.
 *
 * The mock provides stubs for auth() and database() that can be reconfigured
 * per test using sinon.
 */
import sinon from 'sinon';

const mockSignOut = sinon.stub().resolves();
const mockGetToken = sinon.stub().resolves('fake-token');

const mockCurrentUser = {
  getToken: mockGetToken
};

const mockDbRef = sinon.stub().returns({
  once: sinon.stub().resolves({ val: () => null }),
  on: sinon.stub(),
  off: sinon.stub()
});

if (!global.firebase) {
  global.firebase = {
    auth: sinon.stub().returns({
      currentUser: mockCurrentUser,
      signOut: mockSignOut,
      sendPasswordResetEmail: sinon.stub().resolves()
    }),
    database: sinon.stub().returns({
      ref: mockDbRef
    })
  };
}

if (typeof global.VARAUSSERVER === 'undefined') {
  global.VARAUSSERVER = 'http://test-server';
}

export { mockSignOut, mockGetToken, mockCurrentUser, mockDbRef };
