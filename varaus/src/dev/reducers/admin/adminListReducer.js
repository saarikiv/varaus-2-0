import { 
  FETCH_ADMIN_LIST, 
  EXPAND_ADMIN_LIST, 
  MINIMIZE_ADMIN_LIST 
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {expanded: false, list: []}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case FETCH_ADMIN_LIST:
      return Object.assign({}, state, {list: action.payload})
    case EXPAND_ADMIN_LIST:
      return Object.assign({}, state, {expanded: true})
    case MINIMIZE_ADMIN_LIST:
      return Object.assign({}, state, {expanded: false})
    default:
      return state
  }
}
