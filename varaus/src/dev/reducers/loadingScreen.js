import {
    CHANGE_LOADINGSCREEN_STATE
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    inTimeout: false,
    visible: false,
    context: "",
    success: "undefined"
}

export default function(state = INITIAL_STATE, action) {

    switch (action.type) {
        case CHANGE_LOADINGSCREEN_STATE:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}