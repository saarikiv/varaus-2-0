import {
    UPDATE_USERS_BOOKINGS,
    UPDATE_USERS_TRANSACTIONS,
    USER_ERROR,
    USER_DETAILS_UPDATED_IN_DB,
    STOP_UPDATING_USER_DETAILS_FROM_DB,
    DELETE_PROFILE_REQUEST,
    DELETE_PROFILE_SUCCESS,
    DELETE_PROFILE_FAILURE,
    ACTIVE_BOOKINGS_CHECKED
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    key: "0",
    bookingsReady: false,
    transactionsReady: false,
    error: {
        code: "0",
        message: "ok"
    },
    bookings: [],
    history: [],
    roles: {
        admin: false,
        instructor: false
    },
    transactions: {
        details: {
            expired: [],
            valid: []
        }
    },
    deletionInProgress: false,
    hasActiveBookings: null
}

export default function(state = INITIAL_STATE, action) {

    switch (action.type) {
        case UPDATE_USERS_BOOKINGS:
            return Object.assign({}, state, action.payload);
        case UPDATE_USERS_TRANSACTIONS:
            return Object.assign({}, state, action.payload);
        case USER_ERROR:
            return Object.assign({}, state, action.payload);
        case USER_DETAILS_UPDATED_IN_DB:
            return Object.assign({}, state, action.payload);;
        case STOP_UPDATING_USER_DETAILS_FROM_DB:
            return INITIAL_STATE;
        case DELETE_PROFILE_REQUEST:
            return Object.assign({}, state, { deletionInProgress: true });
        case DELETE_PROFILE_SUCCESS:
            return INITIAL_STATE;
        case DELETE_PROFILE_FAILURE:
            return Object.assign({}, state, action.payload, { deletionInProgress: false });
        case ACTIVE_BOOKINGS_CHECKED:
            return Object.assign({}, state, { hasActiveBookings: action.payload });
        default:
            return state;
    }
}