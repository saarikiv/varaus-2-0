/**
 * Shop reducer — manages checkout/payment flow state.
 *
 * @typedef {Object} ShopState
 * @property {Object|{}} cart - The currently selected shop item, or empty object.
 * @property {Array} items - Available shop items fetched from Firebase.
 * @property {"start"|"delayedTransactionInitialized"|"delayedPayment"
 *   |"cashPayment"|"done"|"error"|"timeout"} phase - Current checkout phase.
 * @property {string} initializedTransaction - Pending transaction ID ("0" when none).
 * @property {Object} purchaseResult - Result data from a completed purchase.
 * @property {string} token - Client token (legacy).
 * @property {{ code: string, message: string }} error - Current error state.
 *
 * Phase transitions (state machine):
 *   start → delayedTransactionInitialized → delayedPayment
 *   start → cashPayment → done
 *   Any phase → error (via CHECKOUT_ERROR — sets error without changing phase)
 *   Any phase → timeout (via CHECKOUT_TIMEOUT)
 */

import {
    START_CHECKOUT_FLOW,
    FETCH_SHOP_ITEMS,
    ADD_TO_CART,
    DO_PURCHASE_TRANSACTION,
    CHECKOUT_ERROR,
    CHECKOUT_TIMEOUT,
    BUY_WITH_CASH,
    BUY_DELAYED,
    EXECUTE_CASH_PURCHASE,
    RESET_SHOP
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    cart: {},
    error: {
        code: "0",
        message: "no error"
    },
    items: [],
    token: "",
    initializedTransaction: "0",
    purchaseResult: {},
    phase: "start"
}

export default function shopReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case RESET_SHOP:
            return Object.assign({}, INITIAL_STATE, { items: state.items });

        case DO_PURCHASE_TRANSACTION:
            return Object.assign({}, state, {
                phase: action.payload.phase,
                initializedTransaction: action.payload.initializedTransaction || state.initializedTransaction,
                purchaseResult: action.payload.purchaseResult || state.purchaseResult,
                cart: action.payload.cart !== undefined ? action.payload.cart : state.cart,
                error: action.payload.error || state.error
            });

        // Delayed flow: start → delayedTransactionInitialized → delayedPayment
        case BUY_DELAYED:
            return Object.assign({}, state, {
                phase: "delayedPayment",
                initializedTransaction: "0",
                error: { code: "0", message: "no error" }
            });

        // Cash flow: start → cashPayment → done
        case BUY_WITH_CASH:
            return Object.assign({}, state, {
                phase: "cashPayment",
                error: { code: "0", message: "no error" }
            });

        case EXECUTE_CASH_PURCHASE:
            return Object.assign({}, state, {
                cart: {},
                phase: "done",
                purchaseResult: action.payload.purchaseResult || {},
                error: { code: "0", message: "no error" }
            });

        // Checkout start
        case START_CHECKOUT_FLOW:
            return Object.assign({}, state, action.payload);

        // Data loading — no phase change
        case FETCH_SHOP_ITEMS:
            return Object.assign({}, state, {
                items: action.payload.items
            });

        case ADD_TO_CART:
            return Object.assign({}, state, {
                cart: action.payload.cart,
                error: { code: "0", message: "no error" }
            });

        // Timeout — any phase → timeout
        case CHECKOUT_TIMEOUT:
            return Object.assign({}, state, {
                phase: "timeout"
            });

        // Error — sets error state WITHOUT corrupting the current phase
        case CHECKOUT_ERROR:
            return Object.assign({}, state, {
                error: action.payload.error
            });

        default:
            return state;
    }
}
