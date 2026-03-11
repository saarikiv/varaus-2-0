// Feature: remove-paytrail, Property 1: Removed action types are ignored by the shop reducer
// Validates: Requirement 9.1

import { expect } from 'chai';
import fc from 'fast-check';
import shopReducer from '../../src/dev/reducers/shopReducer.js';

/**
 * Arbitrary for valid shop reducer states matching INITIAL_STATE shape.
 */
function shopStateArb() {
  return fc.record({
    cart: fc.oneof(fc.constant({}), fc.record({ title: fc.string(), price: fc.integer() })),
    error: fc.record({ code: fc.string(), message: fc.string() }),
    items: fc.array(fc.record({ key: fc.string(), title: fc.string() })),
    token: fc.string(),
    initializedTransaction: fc.string(),
    purchaseResult: fc.oneof(fc.constant({}), fc.record({ id: fc.string() })),
    phase: fc.constantFrom('start', 'delayedTransactionInitialized', 'delayedPayment', 'cashPayment', 'done', 'error', 'timeout')
  });
}

/** The removed Paytrail action type strings (constants no longer exist in actionTypes.js). */
const REMOVED_ACTION_TYPES = ['BUY_WITH_PAYTRAIL', 'FINISH_WITH_PAYTRAIL', 'GET_AUTH_CODE'];

const removedActionTypeArb = fc.constantFrom(...REMOVED_ACTION_TYPES);

describe('Property 1: Removed action types are ignored by the shop reducer', function () {

  it('dispatching a removed Paytrail action type returns state unchanged', function () {
    // **Validates: Requirements 9.1**
    fc.assert(
      fc.property(shopStateArb(), removedActionTypeArb, (state, actionType) => {
        const result = shopReducer(state, { type: actionType });
        expect(result).to.deep.equal(state);
      }),
      { numRuns: 100 }
    );
  });

  it('dispatching removed Paytrail action types with arbitrary payloads returns state unchanged', function () {
    // **Validates: Requirements 9.1**
    fc.assert(
      fc.property(
        shopStateArb(),
        removedActionTypeArb,
        fc.dictionary(fc.string(), fc.jsonValue()),
        (state, actionType, payload) => {
          const result = shopReducer(state, { type: actionType, payload });
          expect(result).to.deep.equal(state);
        }
      ),
      { numRuns: 100 }
    );
  });

});

// Feature: remove-paytrail, Property 2: Non-Paytrail action types are handled correctly after removal
// Validates: Requirement 9.4

const DEFAULT_ERROR = { code: "0", message: "no error" };

const INITIAL_STATE = {
  cart: {},
  error: { code: "0", message: "no error" },
  items: [],
  token: "",
  initializedTransaction: "0",
  purchaseResult: {},
  phase: "start"
};

/**
 * Arbitrary for DO_PURCHASE_TRANSACTION payload.
 * The reducer merges phase, initializedTransaction, purchaseResult, cart, error from payload.
 */
function doPurchasePayloadArb() {
  return fc.record({
    phase: fc.constantFrom('start', 'delayedTransactionInitialized', 'cashPayment', 'done'),
    initializedTransaction: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    purchaseResult: fc.option(fc.record({ id: fc.string() }), { nil: undefined }),
    cart: fc.option(fc.record({ title: fc.string() }), { nil: undefined }),
    error: fc.option(fc.record({ code: fc.string(), message: fc.string() }), { nil: undefined })
  });
}

describe('Property 2: Non-Paytrail action types are handled correctly after removal', function () {

  it('RESET_SHOP returns INITIAL_STATE with items preserved from current state', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(shopStateArb(), (state) => {
        const result = shopReducer(state, { type: 'RESET_SHOP' });
        const expected = Object.assign({}, INITIAL_STATE, { items: state.items });
        expect(result).to.deep.equal(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('DO_PURCHASE_TRANSACTION merges payload fields into state', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(shopStateArb(), doPurchasePayloadArb(), (state, payload) => {
        const result = shopReducer(state, { type: 'DO_PURCHASE_TRANSACTION', payload });
        expect(result.phase).to.equal(payload.phase);
        expect(result.initializedTransaction).to.equal(
          payload.initializedTransaction !== undefined ? payload.initializedTransaction : state.initializedTransaction
        );
        expect(result.purchaseResult).to.deep.equal(
          payload.purchaseResult !== undefined ? payload.purchaseResult : state.purchaseResult
        );
        expect(result.cart).to.deep.equal(
          payload.cart !== undefined ? payload.cart : state.cart
        );
        expect(result.error).to.deep.equal(
          payload.error !== undefined ? payload.error : state.error
        );
        // Other fields preserved
        expect(result.token).to.equal(state.token);
        expect(result.items).to.deep.equal(state.items);
      }),
      { numRuns: 100 }
    );
  });

  it('BUY_DELAYED sets phase to delayedPayment, initializedTransaction to 0, error to default', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(shopStateArb(), (state) => {
        const result = shopReducer(state, { type: 'BUY_DELAYED' });
        expect(result.phase).to.equal('delayedPayment');
        expect(result.initializedTransaction).to.equal('0');
        expect(result.error).to.deep.equal(DEFAULT_ERROR);
        // Other fields preserved
        expect(result.cart).to.deep.equal(state.cart);
        expect(result.items).to.deep.equal(state.items);
        expect(result.token).to.equal(state.token);
        expect(result.purchaseResult).to.deep.equal(state.purchaseResult);
      }),
      { numRuns: 100 }
    );
  });

  it('BUY_WITH_CASH sets phase to cashPayment, error to default', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(shopStateArb(), (state) => {
        const result = shopReducer(state, { type: 'BUY_WITH_CASH' });
        expect(result.phase).to.equal('cashPayment');
        expect(result.error).to.deep.equal(DEFAULT_ERROR);
        // Other fields preserved
        expect(result.cart).to.deep.equal(state.cart);
        expect(result.items).to.deep.equal(state.items);
        expect(result.token).to.equal(state.token);
        expect(result.initializedTransaction).to.equal(state.initializedTransaction);
        expect(result.purchaseResult).to.deep.equal(state.purchaseResult);
      }),
      { numRuns: 100 }
    );
  });

  it('EXECUTE_CASH_PURCHASE sets cart to {}, phase to done, purchaseResult from payload, error to default', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(
        shopStateArb(),
        fc.option(fc.record({ id: fc.string() }), { nil: undefined }),
        (state, purchaseResult) => {
          const payload = purchaseResult !== undefined ? { purchaseResult } : {};
          const result = shopReducer(state, { type: 'EXECUTE_CASH_PURCHASE', payload });
          expect(result.cart).to.deep.equal({});
          expect(result.phase).to.equal('done');
          expect(result.purchaseResult).to.deep.equal(purchaseResult || {});
          expect(result.error).to.deep.equal(DEFAULT_ERROR);
          // Other fields preserved
          expect(result.items).to.deep.equal(state.items);
          expect(result.token).to.equal(state.token);
          expect(result.initializedTransaction).to.equal(state.initializedTransaction);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('START_CHECKOUT_FLOW merges payload into state', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(
        shopStateArb(),
        fc.record({
          phase: fc.constantFrom('start', 'delayedTransactionInitialized', 'cashPayment'),
          token: fc.string()
        }),
        (state, payload) => {
          const result = shopReducer(state, { type: 'START_CHECKOUT_FLOW', payload });
          expect(result.phase).to.equal(payload.phase);
          expect(result.token).to.equal(payload.token);
          // Fields not in payload are preserved
          expect(result.cart).to.deep.equal(state.cart);
          expect(result.items).to.deep.equal(state.items);
          expect(result.error).to.deep.equal(state.error);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('FETCH_SHOP_ITEMS sets items from payload', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(
        shopStateArb(),
        fc.array(fc.record({ key: fc.string(), title: fc.string() })),
        (state, items) => {
          const result = shopReducer(state, { type: 'FETCH_SHOP_ITEMS', payload: { items } });
          expect(result.items).to.deep.equal(items);
          // Other fields preserved
          expect(result.cart).to.deep.equal(state.cart);
          expect(result.phase).to.equal(state.phase);
          expect(result.token).to.equal(state.token);
          expect(result.error).to.deep.equal(state.error);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ADD_TO_CART sets cart from payload, error to default', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(
        shopStateArb(),
        fc.record({ title: fc.string(), price: fc.integer() }),
        (state, cart) => {
          const result = shopReducer(state, { type: 'ADD_TO_CART', payload: { cart } });
          expect(result.cart).to.deep.equal(cart);
          expect(result.error).to.deep.equal(DEFAULT_ERROR);
          // Other fields preserved
          expect(result.items).to.deep.equal(state.items);
          expect(result.phase).to.equal(state.phase);
          expect(result.token).to.equal(state.token);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('CHECKOUT_TIMEOUT sets phase to timeout', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(shopStateArb(), (state) => {
        const result = shopReducer(state, { type: 'CHECKOUT_TIMEOUT' });
        expect(result.phase).to.equal('timeout');
        // Other fields preserved
        expect(result.cart).to.deep.equal(state.cart);
        expect(result.items).to.deep.equal(state.items);
        expect(result.token).to.equal(state.token);
        expect(result.error).to.deep.equal(state.error);
      }),
      { numRuns: 100 }
    );
  });

  it('CHECKOUT_ERROR sets error from payload', function () {
    // **Validates: Requirements 9.4**
    fc.assert(
      fc.property(
        shopStateArb(),
        fc.record({ code: fc.string(), message: fc.string() }),
        (state, error) => {
          const result = shopReducer(state, { type: 'CHECKOUT_ERROR', payload: { error } });
          expect(result.error).to.deep.equal(error);
          // Phase and other fields preserved
          expect(result.phase).to.equal(state.phase);
          expect(result.cart).to.deep.equal(state.cart);
          expect(result.items).to.deep.equal(state.items);
          expect(result.token).to.equal(state.token);
        }
      ),
      { numRuns: 100 }
    );
  });

});

// Feature: remove-paytrail, Property 3: Cancel pending transaction dispatches correctly for any transaction ID
// Validates: Requirements 8.2, 12.2

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a minimal dispatch-tracking store that supports thunks.
 * Avoids redux-mock-store ESM/CJS interop issues.
 */
function createTrackingStore() {
  const actions = [];
  const dispatch = (action) => {
    if (typeof action === 'function') {
      return action(dispatch);
    }
    actions.push(action);
    return action;
  };
  return { dispatch, getActions: () => actions };
}

describe('Property 3: Cancel pending transaction dispatches correctly for any transaction ID', function () {

  let cancelPendingTransaction;
  let originalFirebase;

  before(async function () {
    // Set up a minimal firebase global so shop.js module can load
    // (it has `const ShopItemsRef = firebase.database().ref('/shopItems/')` at top level)
    originalFirebase = global.firebase;
    global.firebase = {
      database: () => ({
        ref: () => ({
          remove: () => Promise.resolve(),
          on: () => {},
          off: () => {},
          once: () => Promise.resolve({ val: () => null })
        })
      }),
      auth: () => ({
        currentUser: { getToken: () => Promise.resolve('mock-token') }
      })
    };

    // Dynamically import shop.js — the firebase global is now available
    const shopModule = await import('../../src/dev/actions/shop.js');
    cancelPendingTransaction = shopModule.cancelPendingTransaction;
  });

  after(function () {
    global.firebase = originalFirebase;
  });

  it('dispatches loading screen, performs Firebase remove, then dispatches RESET_SHOP for any non-zero transaction ID', function () {
    // **Validates: Requirements 8.2, 12.2**
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter(s => s !== '0'),
        async (id) => {
          let capturedRefPath = null;
          global.firebase = {
            database: () => ({
              ref: (path) => {
                capturedRefPath = path;
                return {
                  remove: () => Promise.resolve(),
                  on: () => {},
                  off: () => {}
                };
              }
            }),
            auth: () => ({
              currentUser: { getToken: () => Promise.resolve('mock-token') }
            })
          };

          const store = createTrackingStore();
          store.dispatch(cancelPendingTransaction(id));
          await flushPromises();

          const actions = store.getActions();

          // First action: show loading screen
          expect(actions[0]).to.deep.equal({
            type: 'CHANGE_LOADINGSCREEN_STATE',
            payload: {
              inTimeout: false,
              visible: true,
              context: 'Perutaan tapahtuma',
              success: 'undefined'
            }
          });

          // Second action: hide loading screen (inTimeout phase)
          expect(actions[1]).to.deep.equal({
            type: 'CHANGE_LOADINGSCREEN_STATE',
            payload: {
              inTimeout: true,
              visible: true,
              context: 'Tapahtuma peruttu',
              success: true
            }
          });

          // Third action: RESET_SHOP
          expect(actions[2]).to.deep.equal({
            type: 'RESET_SHOP'
          });

          // Verify Firebase was called with correct ref path
          expect(capturedRefPath).to.equal('/pendingtransactions/' + id);
        }
      ),
      { numRuns: 100 }
    );
  });

});
