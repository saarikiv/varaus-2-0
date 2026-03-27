// Feature: profile-deletion, Property: Reducer deletion state transitions
// **Validates: Requirements 1.4, 1.6, 3.3**

import { expect } from 'chai';
import fc from 'fast-check';
import userReducer from '../../src/dev/reducers/userReducer.js';
import {
  DELETE_PROFILE_REQUEST,
  DELETE_PROFILE_SUCCESS,
  DELETE_PROFILE_FAILURE,
  ACTIVE_BOOKINGS_CHECKED
} from '../../src/dev/actions/actionTypes.js';

/**
 * Arbitrary that generates a random sequence of deletion-related actions.
 * Each action is one of: REQUEST, SUCCESS, FAILURE, ACTIVE_BOOKINGS_CHECKED.
 */
const deletionActionArb = fc.oneof(
  fc.constant({ type: DELETE_PROFILE_REQUEST }),
  fc.constant({ type: DELETE_PROFILE_SUCCESS }),
  fc.record({
    type: fc.constant(DELETE_PROFILE_FAILURE),
    payload: fc.record({
      error: fc.record({
        code: fc.string({ minLength: 1, maxLength: 10 }),
        message: fc.string({ minLength: 1, maxLength: 100 })
      })
    })
  }),
  fc.boolean().map(val => ({ type: ACTIVE_BOOKINGS_CHECKED, payload: val }))
);

const deletionActionSequenceArb = fc.array(deletionActionArb, { minLength: 1, maxLength: 30 });

describe('profile-deletion: Reducer deletion state transitions', function () {

  it('deletionInProgress is true only between a REQUEST and a SUCCESS or FAILURE', function () {
    // **Validates: Requirements 1.4, 1.6**
    fc.assert(
      fc.property(deletionActionSequenceArb, (actions) => {
        let state = userReducer(undefined, { type: '@@INIT' });
        let expectInProgress = false;

        for (const action of actions) {
          state = userReducer(state, action);

          if (action.type === DELETE_PROFILE_REQUEST) {
            expectInProgress = true;
          } else if (action.type === DELETE_PROFILE_SUCCESS || action.type === DELETE_PROFILE_FAILURE) {
            expectInProgress = false;
          }
          // ACTIVE_BOOKINGS_CHECKED does not change deletionInProgress

          expect(state.deletionInProgress).to.equal(expectInProgress,
            `After ${action.type}, deletionInProgress should be ${expectInProgress}`);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('hasActiveBookings reflects the last ACTIVE_BOOKINGS_CHECKED payload', function () {
    // **Validates: Requirements 3.3**
    fc.assert(
      fc.property(deletionActionSequenceArb, (actions) => {
        let state = userReducer(undefined, { type: '@@INIT' });
        let expectedHasActive = null; // initial value

        for (const action of actions) {
          state = userReducer(state, action);

          if (action.type === ACTIVE_BOOKINGS_CHECKED) {
            expectedHasActive = action.payload;
          } else if (action.type === DELETE_PROFILE_SUCCESS) {
            // SUCCESS resets to initial state, so hasActiveBookings goes back to null
            expectedHasActive = null;
          }

          expect(state.hasActiveBookings).to.equal(expectedHasActive,
            `After ${action.type}, hasActiveBookings should be ${expectedHasActive}`);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('DELETE_PROFILE_SUCCESS always resets state to initial values', function () {
    // **Validates: Requirements 1.4, 1.6**
    fc.assert(
      fc.property(deletionActionSequenceArb, (actions) => {
        let state = userReducer(undefined, { type: '@@INIT' });

        for (const action of actions) {
          state = userReducer(state, action);
        }

        // Apply a SUCCESS at the end — should always reset
        state = userReducer(state, { type: DELETE_PROFILE_SUCCESS });
        const initial = userReducer(undefined, { type: '@@INIT' });
        expect(state).to.deep.equal(initial);
      }),
      { numRuns: 200 }
    );
  });

});
