import {
    ADD_USER,
    REMOVE_USER,
    AUTH_ERROR,
    AUTH_TIMEOUT,
    EMAIL_UPDATED,
    PASSWORD_UPDATED,
    SIGN_OUT
} from '../actions/actionTypes.js'

/**
 * @typedef {Object} AuthState
 * @property {string} [uid] - Firebase user UID (set on login, cleared on logout)
 * @property {string} [email] - User email address
 * @property {Object} [userdata] - Full Firebase user object
 * @property {{ code: string, message: string }} error - Last auth error
 * @property {boolean} timeout - Whether auth has timed out
 * @property {boolean} emailUpdated - Whether email was recently updated
 * @property {boolean} passwordUpdated - Whether password was recently updated
 */

/** @type {AuthState} */
const INITIAL_STATE = {
    uid: undefined,
    email: undefined,
    userdata: undefined,
    error: {
        code: "0",
        message: ""
    },
    timeout: false,
    emailUpdated: false,
    passwordUpdated: false
}

export default function authReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case ADD_USER:
            return Object.assign({}, INITIAL_STATE, action.payload);
        case REMOVE_USER:
            return Object.assign({}, INITIAL_STATE);
        case SIGN_OUT:
            return Object.assign({}, INITIAL_STATE);
        case AUTH_ERROR:
            console.error("AUTH_ERROR", action.payload)
            return Object.assign({}, state, action.payload);
        case AUTH_TIMEOUT:
            return Object.assign({}, state, action.payload);
        case EMAIL_UPDATED:
            return Object.assign({}, state, action.payload);
        case PASSWORD_UPDATED:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}
