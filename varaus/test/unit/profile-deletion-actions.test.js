// Unit tests for deleteProfile and checkActiveBookings action creators
// Validates: Requirements 1.3, 1.4, 1.5, 1.6, 3.2
// firebaseMock sets up global.firebase before user.js module-level code runs
import { mockSignOut, mockGetToken, mockCurrentUser, mockDbRef } from '../helpers/firebaseMock.js';
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { deleteProfile, checkActiveBookings } from '../../src/dev/actions/user.js';
import { DELETE_PROFILE_REQUEST, DELETE_PROFILE_SUCCESS, DELETE_PROFILE_FAILURE, ACTIVE_BOOKINGS_CHECKED, SIGN_OUT } from '../../src/dev/actions/actionTypes.js';

/** Minimal thunk-aware store. Avoids redux-mock-store ESM/CJS issues. */
function createTrackingStore() {
  const actions = [];
  const dispatch = (action) => {
    if (typeof action === 'function') return action(dispatch);
    actions.push(action);
    return action;
  };
  return { dispatch, getActions: () => actions };
}

/** Flush microtask queue to let promise chains settle */
function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 50));
}

describe('Profile deletion actions', function () {
  let axiosPostStub;

  beforeEach(function () {
    axiosPostStub = sinon.stub(axios, 'post');
    mockGetToken.reset();
    mockGetToken.resolves('fake-token');
    mockSignOut.reset();
    mockSignOut.resolves();
    mockDbRef.reset();
    global.firebase.auth.returns({ currentUser: mockCurrentUser, signOut: mockSignOut, sendPasswordResetEmail: sinon.stub().resolves() });
  });
  afterEach(function () {
    axiosPostStub.restore();
  });

  describe('deleteProfile', function () {
    // **Validates: Requirements 1.3, 1.4, 1.5**
    it('dispatches REQUEST then SUCCESS on 200 response', async function () {
      axiosPostStub.resolves({ status: 200, data: { status: 'ok' } });
      const store = createTrackingStore();
      store.dispatch(deleteProfile());
      await flushPromises();
      const types = store.getActions().map(a => a.type);
      expect(types).to.include(DELETE_PROFILE_REQUEST);
      expect(types).to.include(DELETE_PROFILE_SUCCESS);
      expect(types).to.include(SIGN_OUT);
      expect(types.indexOf(DELETE_PROFILE_REQUEST)).to.be.lessThan(types.indexOf(DELETE_PROFILE_SUCCESS));
    });

    // **Validates: Requirements 1.4, 1.6**
    it('dispatches REQUEST then FAILURE on error response', async function () {
      const err = new Error('Request failed with status code 500');
      err.response = { status: 500, data: { error: 'Internal server error' } };
      axiosPostStub.rejects(err);
      const store = createTrackingStore();
      store.dispatch(deleteProfile());
      await flushPromises();
      const types = store.getActions().map(a => a.type);
      expect(types).to.include(DELETE_PROFILE_REQUEST);
      expect(types).to.include(DELETE_PROFILE_FAILURE);
      expect(types).to.not.include(DELETE_PROFILE_SUCCESS);
      expect(types.indexOf(DELETE_PROFILE_REQUEST)).to.be.lessThan(types.indexOf(DELETE_PROFILE_FAILURE));
      const failAction = store.getActions().find(a => a.type === DELETE_PROFILE_FAILURE);
      expect(failAction.payload.error.code).to.equal('DELETE_PROFILE_ERROR');
    });

    // **Validates: Requirements 1.6, 3.2**
    it('dispatches FAILURE with active-bookings message on 409 response', async function () {
      const err = new Error('Request failed with status code 409');
      err.response = { status: 409, data: { error: 'Active bookings exist' } };
      axiosPostStub.rejects(err);
      const store = createTrackingStore();
      store.dispatch(deleteProfile());
      await flushPromises();
      const types = store.getActions().map(a => a.type);
      expect(types).to.include(DELETE_PROFILE_REQUEST);
      expect(types).to.include(DELETE_PROFILE_FAILURE);
      const failAction = store.getActions().find(a => a.type === DELETE_PROFILE_FAILURE);
      expect(failAction.payload.error.code).to.equal('ACTIVE_BOOKINGS');
      expect(failAction.payload.error.message).to.include('aktiivisia varauksia');
    });
  });

  describe('checkActiveBookings', function () {
    // **Validates: Requirement 3.2**
    it('dispatches hasActiveBookings=true when future bookings exist', async function () {
      const futureTime = Date.now() + 200000;
      mockDbRef.withArgs('/slots/').returns({
        once: sinon.stub().resolves({ val: () => ({ 'slot1': { start: 0, end: 3600000 } }) })
      });
      mockDbRef.withArgs('/bookingsbyuser/uid123').returns({
        once: sinon.stub().resolves({ val: () => ({ 'slot1': { 'b1': { slotTime: futureTime } } }) })
      });
      const store = createTrackingStore();
      store.dispatch(checkActiveBookings('uid123'));
      await flushPromises();
      const checked = store.getActions().find(a => a.type === ACTIVE_BOOKINGS_CHECKED);
      expect(checked).to.exist;
      expect(checked.payload).to.equal(true);
    });

    // **Validates: Requirement 3.2**
    it('dispatches hasActiveBookings=false when all bookings are in the past', async function () {
      mockDbRef.withArgs('/slots/').returns({
        once: sinon.stub().resolves({ val: () => ({ 'slot1': { start: 0, end: 3600000 } }) })
      });
      mockDbRef.withArgs('/bookingsbyuser/uid123').returns({
        once: sinon.stub().resolves({ val: () => ({ 'slot1': { 'b1': { slotTime: 1000 } } }) })
      });
      const store = createTrackingStore();
      store.dispatch(checkActiveBookings('uid123'));
      await flushPromises();
      const checked = store.getActions().find(a => a.type === ACTIVE_BOOKINGS_CHECKED);
      expect(checked).to.exist;
      expect(checked.payload).to.equal(false);
    });

    // **Validates: Requirement 3.2**
    it('dispatches hasActiveBookings=false when no bookings exist', async function () {
      mockDbRef.withArgs('/slots/').returns({
        once: sinon.stub().resolves({ val: () => ({ 'slot1': { start: 0, end: 3600000 } }) })
      });
      mockDbRef.withArgs('/bookingsbyuser/uid123').returns({
        once: sinon.stub().resolves({ val: () => null })
      });
      const store = createTrackingStore();
      store.dispatch(checkActiveBookings('uid123'));
      await flushPromises();
      const checked = store.getActions().find(a => a.type === ACTIVE_BOOKINGS_CHECKED);
      expect(checked).to.exist;
      expect(checked.payload).to.equal(false);
    });
  });
});
