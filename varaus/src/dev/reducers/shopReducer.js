import {
    START_CHECKOUT_FLOW,
    FETCH_SHOP_ITEMS,
    ADD_TO_CART,
    GET_CLIENT_TOKEN,
    DO_PURCHASE_TRANSACTION,
    CHECKOUT_ERROR,
    CHECKOUT_TIMEOUT,
    BUY_WITH_CASH,
    BUY_DELAYED,
    BUY_WITH_PAYTRAIL,
    EXECUTE_CASH_PURCHASE,
    RESET_SHOP,
    FINISH_WITH_PAYTRAIL,
    GET_AUTH_CODE
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
    authCode: "",
    purchaseResult: {},
    phase: "start"
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case RESET_SHOP:
            return Object.assign({},INITIAL_STATE,  {items: state.items});
        case BUY_WITH_PAYTRAIL:
            return Object.assign({}, state, action.payload);
        case FINISH_WITH_PAYTRAIL:
            return Object.assign({}, state, action.payload);
        case BUY_DELAYED:
            return Object.assign({}, state, action.payload);
        case BUY_WITH_CASH:
            return Object.assign({}, state, action.payload);
        case EXECUTE_CASH_PURCHASE:
            return Object.assign({}, state, action.payload);
        case START_CHECKOUT_FLOW:
            return Object.assign({}, state, action.payload);
        case CHECKOUT_TIMEOUT:
            return Object.assign({}, state, action.payload);
        case DO_PURCHASE_TRANSACTION:
            return Object.assign({}, state, action.payload);
        case FETCH_SHOP_ITEMS:
            return Object.assign({}, state, action.payload);
        case ADD_TO_CART:
            return Object.assign({}, state, action.payload);
        case GET_AUTH_CODE:
            return Object.assign({}, state, action.payload);
        case CHECKOUT_ERROR:
            return Object.assign({}, state, action.payload, {
                phase: "error"
            });
        default:
            return state
    }
}
