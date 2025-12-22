import {
    FETCH_PENDING_TRANSACTIONS
} from '../actions/actionTypes.js'

const INITIAL_STATE = {list: []}

export default function(state = INITIAL_STATE, action) {

    switch (action.type) {
        case FETCH_PENDING_TRANSACTIONS:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}