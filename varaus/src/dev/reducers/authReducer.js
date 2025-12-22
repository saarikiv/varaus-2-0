import {
    ADD_USER,
    REMOVE_USER,
    AUTH_ERROR,
    USER_DETAILS_UPDATED_IN_DB,
    AUTH_TIMEOUT,
    EMAIL_UPDATED,
    PASSWORD_UPDATED
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    error: {
        code: "0",
        message: ""
    },
    timeout: false,
    emailUpdated: false,
    passwordUpdated: false
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case ADD_USER:
            return Object.assign({}, {
                error: {
                    code: "0",
                    message: ""
                }
            }, action.payload);
        case REMOVE_USER:
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