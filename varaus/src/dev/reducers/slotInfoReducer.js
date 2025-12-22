import {
    PUT_SLOT_INFO,
    REMOVE_SLOT_INFO,
    FLAG_SLOT_INFO_TO_EXIT
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
    key: "0",
    closeInfo: false,
    bookings: {
      all: [],
      user: []
    }
};

export default function(state = INITIAL_STATE, action) {
    switch (action.type) {
        case FLAG_SLOT_INFO_TO_EXIT:
            return Object.assign({}, state, {closeInfo: true});
        case PUT_SLOT_INFO:
            return Object.assign({}, state, action.payload);
        case REMOVE_SLOT_INFO:
            return INITIAL_STATE
        default:
            return state;
    }
}
