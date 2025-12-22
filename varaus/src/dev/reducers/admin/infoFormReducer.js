import {
    EXPAND_INFO_FORM,
    MINIMIZE_INFO_FORM
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    expander: ""
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case EXPAND_INFO_FORM:
            return Object.assign({}, state, action.payload)
        case MINIMIZE_INFO_FORM:
            return Object.assign({}, state, action.payload)
        default:
            return state
    }
}