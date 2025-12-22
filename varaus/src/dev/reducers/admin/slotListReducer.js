import {
    FETCH_SLOT_LIST,
    EXPAND_SLOT_LIST,
    MINIMIZE_SLOT_LIST
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    list: []
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case FETCH_SLOT_LIST:
            return Object.assign({}, state, action.payload)
        case EXPAND_SLOT_LIST:
            return Object.assign({}, state, {
                expanded: true
            })
        case MINIMIZE_SLOT_LIST:
            return Object.assign({}, state, {
                expanded: false
            })
        default:
            return state
    }
}