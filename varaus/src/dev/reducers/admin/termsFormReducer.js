import {
    EXPAND_TERMS_FORM,
    MINIMIZE_TERMS_FORM
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    expander: ""
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case EXPAND_TERMS_FORM:
            return Object.assign({}, state, action.payload)
        case MINIMIZE_TERMS_FORM:
            return Object.assign({}, state, action.payload)
        default:
            return state
    }
}