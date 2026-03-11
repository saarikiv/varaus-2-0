// Feature: varaus, Property 2: Authentication state consistency
// Validates: Requirements 3.6, 3.7

import { expect } from 'chai';
import authReducer from '../../src/dev/reducers/authReducer.js';
import {
  ADD_USER,
  REMOVE_USER,
  AUTH_ERROR,
  AUTH_TIMEOUT,
  EMAIL_UPDATED,
  PASSWORD_UPDATED,
  SIGN_OUT
} from '../../src/dev/actions/actionTypes.js';

const INITIAL_STATE = {
  uid: undefined,
  email: undefined,
  userdata: undefined,
  error: { code: '0', message: '' },
  timeout: false,
  emailUpdated: false,
  passwordUpdated: false
};

describe('Property 2: Authentication state consistency — authReducer', function () {

  it('returns initial state for unknown action', function () {
    const state = authReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state).to.deep.equal(INITIAL_STATE);
  });

  it('ADD_USER sets user fields from payload', function () {
    // **Validates: Requirement 3.6**
    const payload = { uid: 'u1', email: 'test@example.com', userdata: { displayName: 'Test' } };
    const state = authReducer(undefined, { type: ADD_USER, payload });
    expect(state.uid).to.equal('u1');
    expect(state.email).to.equal('test@example.com');
    expect(state.userdata).to.deep.equal({ displayName: 'Test' });
    // error and flags should be reset to initial
    expect(state.error).to.deep.equal({ code: '0', message: '' });
    expect(state.timeout).to.equal(false);
  });

  it('REMOVE_USER resets to initial state', function () {
    // **Validates: Requirement 3.6**
    const logged = { uid: 'u1', email: 'a@b.com', userdata: {}, error: { code: '0', message: '' }, timeout: false, emailUpdated: false, passwordUpdated: false };
    const state = authReducer(logged, { type: REMOVE_USER });
    expect(state).to.deep.equal(INITIAL_STATE);
  });

  it('SIGN_OUT clears both user and error state', function () {
    // **Validates: Requirement 3.7**
    const withError = {
      uid: 'u1', email: 'a@b.com', userdata: {},
      error: { code: 'auth/wrong-password', message: 'Wrong password' },
      timeout: true, emailUpdated: true, passwordUpdated: true
    };
    const state = authReducer(withError, { type: SIGN_OUT });
    expect(state).to.deep.equal(INITIAL_STATE);
    expect(state.uid).to.be.undefined;
    expect(state.error).to.deep.equal({ code: '0', message: '' });
  });

  it('AUTH_ERROR sets error while preserving user', function () {
    // **Validates: Requirement 3.6**
    const logged = { ...INITIAL_STATE, uid: 'u1', email: 'a@b.com' };
    const payload = { error: { code: 'auth/wrong-password', message: 'Wrong password' } };
    const state = authReducer(logged, { type: AUTH_ERROR, payload });
    expect(state.uid).to.equal('u1');
    expect(state.email).to.equal('a@b.com');
    expect(state.error).to.deep.equal({ code: 'auth/wrong-password', message: 'Wrong password' });
  });

  it('AUTH_TIMEOUT sets timeout flag', function () {
    const state = authReducer(INITIAL_STATE, { type: AUTH_TIMEOUT, payload: { timeout: true } });
    expect(state.timeout).to.equal(true);
    // other fields unchanged
    expect(state.uid).to.be.undefined;
    expect(state.error).to.deep.equal({ code: '0', message: '' });
  });

  it('EMAIL_UPDATED sets emailUpdated flag', function () {
    const logged = { ...INITIAL_STATE, uid: 'u1', email: 'old@b.com' };
    const state = authReducer(logged, { type: EMAIL_UPDATED, payload: { emailUpdated: true } });
    expect(state.emailUpdated).to.equal(true);
    expect(state.uid).to.equal('u1');
  });

  it('PASSWORD_UPDATED sets passwordUpdated flag', function () {
    const logged = { ...INITIAL_STATE, uid: 'u1' };
    const state = authReducer(logged, { type: PASSWORD_UPDATED, payload: { passwordUpdated: true } });
    expect(state.passwordUpdated).to.equal(true);
    expect(state.uid).to.equal('u1');
  });

  it('after AUTH_ERROR then SIGN_OUT, error is cleared', function () {
    // **Validates: Requirements 3.6, 3.7**
    let state = authReducer(INITIAL_STATE, {
      type: AUTH_ERROR,
      payload: { error: { code: 'auth/user-not-found', message: 'Not found' } }
    });
    expect(state.error).to.deep.equal({ code: 'auth/user-not-found', message: 'Not found' });

    state = authReducer(state, { type: SIGN_OUT });
    expect(state).to.deep.equal(INITIAL_STATE);
  });
});
