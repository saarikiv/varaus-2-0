import {
    CHANGE_SEARCH_BAR
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    value: ""
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case CHANGE_SEARCH_BAR:
            return Object.assign({}, state, action.payload)
        default:
            return state
    }
}