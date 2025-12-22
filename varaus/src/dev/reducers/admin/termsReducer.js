import {
    FETCH_TERMS_LIST,
    EXPAND_TERMS_LIST,
    MINIMIZE_TERMS_LIST
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    list: []
}

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case FETCH_TERMS_LIST:
            return Object.assign({}, state, {list: action.payload})
        case EXPAND_TERMS_LIST:
            return Object.assign({}, state, {
                expanded: true
            })
        case MINIMIZE_TERMS_LIST:
            return Object.assign({}, state, {
                expanded: false
            })
        default:
            return state
    }
}
