// Feature: varaus, Property 14: Loading screen state machine
// Validates: Requirements 21.1, 21.2, 21.3, 21.4

import { expect } from 'chai';
import fc from 'fast-check';
import loadingScreenReducer from '../../src/dev/reducers/loadingScreen.js';
import { CHANGE_LOADINGSCREEN_STATE } from '../../src/dev/actions/actionTypes.js';

/**
 * Helper to build a CHANGE_LOADINGSCREEN_STATE action with a given payload.
 */
function changeAction(payload) {
  return { type: CHANGE_LOADINGSCREEN_STATE, payload };
}

/**
 * Payloads matching the action creators in loadingScreen.js:
 *   SHOW:         { visible: true, inTimeout: false, context: message, success: "undefined" }
 *   HIDE success: { visible: true, inTimeout: true, context: message, success: true }
 *   HIDE error:   { visible: true, inTimeout: true, context: message, success: false }
 *   AUTO-DISMISS: { visible: false, inTimeout: false }
 */
function showPayload(message) {
  return { visible: true, inTimeout: false, context: message, success: "undefined" };
}

function hideSuccessPayload(message) {
  return { visible: true, inTimeout: true, context: message, success: true };
}

function hideErrorPayload(message) {
  return { visible: true, inTimeout: true, context: message, success: false };
}

function autoDismissPayload() {
  return { visible: false, inTimeout: false };
}

/** Arbitrary for random message strings */
const messageArb = fc.string({ minLength: 0, maxLength: 100 });

describe('Property 14: Loading screen state machine', function () {

  it('SHOW action makes visible=true, inTimeout=false, success="undefined"', function () {
    // **Validates: Requirements 21.1**
    fc.assert(
      fc.property(messageArb, (message) => {
        const state = loadingScreenReducer(undefined, changeAction(showPayload(message)));
        expect(state.visible).to.equal(true);
        expect(state.inTimeout).to.equal(false);
        expect(state.success).to.equal("undefined");
        expect(state.context).to.equal(message);
      }),
      { numRuns: 100 }
    );
  });

  it('HIDE with success=true sets inTimeout=true, success=true, visible stays true', function () {
    // **Validates: Requirements 21.2**
    fc.assert(
      fc.property(messageArb, messageArb, (showMsg, hideMsg) => {
        // First SHOW, then HIDE with success
        const shown = loadingScreenReducer(undefined, changeAction(showPayload(showMsg)));
        const hidden = loadingScreenReducer(shown, changeAction(hideSuccessPayload(hideMsg)));
        expect(hidden.visible).to.equal(true);
        expect(hidden.inTimeout).to.equal(true);
        expect(hidden.success).to.equal(true);
        expect(hidden.context).to.equal(hideMsg);
      }),
      { numRuns: 100 }
    );
  });

  it('HIDE with success=false sets inTimeout=true, success=false, visible stays true', function () {
    // **Validates: Requirements 21.3**
    fc.assert(
      fc.property(messageArb, messageArb, (showMsg, hideMsg) => {
        // First SHOW, then HIDE with error
        const shown = loadingScreenReducer(undefined, changeAction(showPayload(showMsg)));
        const hidden = loadingScreenReducer(shown, changeAction(hideErrorPayload(hideMsg)));
        expect(hidden.visible).to.equal(true);
        expect(hidden.inTimeout).to.equal(true);
        expect(hidden.success).to.equal(false);
        expect(hidden.context).to.equal(hideMsg);
      }),
      { numRuns: 100 }
    );
  });

  it('AUTO-DISMISS sets visible=false, inTimeout=false', function () {
    // **Validates: Requirements 21.4**
    fc.assert(
      fc.property(messageArb, fc.boolean(), (message, success) => {
        // SHOW → HIDE → AUTO-DISMISS
        const shown = loadingScreenReducer(undefined, changeAction(showPayload(message)));
        const hidePayload = success ? hideSuccessPayload(message) : hideErrorPayload(message);
        const hidden = loadingScreenReducer(shown, changeAction(hidePayload));
        const dismissed = loadingScreenReducer(hidden, changeAction(autoDismissPayload()));
        expect(dismissed.visible).to.equal(false);
        expect(dismissed.inTimeout).to.equal(false);
      }),
      { numRuns: 100 }
    );
  });

  it('SHOW → HIDE → AUTO-DISMISS sequence always ends with visible=false', function () {
    // **Validates: Requirements 21.1, 21.2, 21.3, 21.4**
    fc.assert(
      fc.property(messageArb, messageArb, fc.boolean(), (showMsg, hideMsg, success) => {
        let state = loadingScreenReducer(undefined, changeAction(showPayload(showMsg)));
        const hidePayload = success ? hideSuccessPayload(hideMsg) : hideErrorPayload(hideMsg);
        state = loadingScreenReducer(state, changeAction(hidePayload));
        state = loadingScreenReducer(state, changeAction(autoDismissPayload()));
        expect(state.visible).to.equal(false);
        expect(state.inTimeout).to.equal(false);
      }),
      { numRuns: 100 }
    );
  });

  it('unknown actions return state unchanged', function () {
    // **Validates: Requirements 21.1, 21.2, 21.3, 21.4**
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(t => t !== CHANGE_LOADINGSCREEN_STATE),
        (unknownType) => {
          const initial = loadingScreenReducer(undefined, { type: '@@INIT' });
          const result = loadingScreenReducer(initial, { type: unknownType });
          expect(result).to.deep.equal(initial);
        }
      ),
      { numRuns: 100 }
    );
  });

});
