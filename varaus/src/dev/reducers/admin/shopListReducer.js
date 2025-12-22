import { 
  FETCH_SHOP_LIST, 
  EXPAND_SHOP_LIST, 
  MINIMIZE_SHOP_LIST, 
  STOP_FETCH_SHOP_LIST 
} from '../../actions/actionTypes.js'

const INITIAL_STATE = {expanded: false, list: []}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case STOP_FETCH_SHOP_LIST:
      return Object.assign({}, state, action.payload)
    case FETCH_SHOP_LIST:
      return Object.assign({}, state, action.payload)
    case EXPAND_SHOP_LIST:
      return Object.assign({}, state, {expanded: true})
    case MINIMIZE_SHOP_LIST:
      return Object.assign({}, state, {expanded: false})
    default:
      return state
  }
}
