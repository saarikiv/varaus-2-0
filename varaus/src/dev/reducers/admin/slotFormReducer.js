import {
    EXPAND_SLOT_FORM,
    MINIMIZE_SLOT_FORM
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    expander: ""
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case EXPAND_SLOT_FORM:
            return Object.assign({}, state, action.payload)
        case MINIMIZE_SLOT_FORM:
            return Object.assign({}, state, action.payload)
        default:
            return state
    }
}