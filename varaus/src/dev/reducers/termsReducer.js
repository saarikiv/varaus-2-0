import { FETCH_TERMS } from '../actions/actionTypes.js'

const INITIAL_STATE = []

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case FETCH_TERMS:
      return action.payload
    default:
      return state
  }
}

