import { FETCH_DIAGNOSTICS } from '../actions/actionTypes.js'

const INITIAL_STATE = {
  dataReady:false
}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case FETCH_DIAGNOSTICS:
      return Object.assign({}, state, action.payload);
    default:
      return state
  }
}

