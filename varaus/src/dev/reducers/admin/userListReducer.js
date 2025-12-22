import { FETCH_USER_LIST, EXPAND_USER_LIST, MINIMIZE_USER_LIST } from '../../actions/actionTypes.js'

const INITIAL_STATE = {expanded: false, list: []}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case FETCH_USER_LIST:
      return Object.assign({}, state, {list: action.payload})
    case EXPAND_USER_LIST:
      return Object.assign({}, state, {expanded: true})
    case MINIMIZE_USER_LIST:
      return Object.assign({}, state, {expanded: false})
    default:
      return state
  }
}
