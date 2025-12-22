import {
    ADD_USERS_TO_OVERVIEW,
    ADD_CREDITS_TO_OVERVIEW,
    REMOVE_TRANSACTION,
    OK_TRANSACTION
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    userList: [],
    usersReady: false,
    credits: {},
    refreshRequired: false
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case REMOVE_TRANSACTION:
        case OK_TRANSACTION:
            return Object.assign({}, INITIAL_STATE, {refreshRequired: true})
        case ADD_USERS_TO_OVERVIEW:
            return Object.assign({}, state, action.payload, {refreshRequired: false})
        case ADD_CREDITS_TO_OVERVIEW:
            let newCredits = Object.assign(state.credits)
            newCredits[action.payload.user] = action.payload.credits
            return Object.assign({}, state, {credits: newCredits})
        default:
            return state
    }
}