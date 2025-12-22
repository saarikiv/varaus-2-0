import { EXPAND_COUNT_SHOP_FORM, MINIMIZE_COUNT_SHOP_FORM } from '../../actions/actionTypes.js'

const INITIAL_STATE = {
    expanded: false,
    expander: ""
}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case EXPAND_COUNT_SHOP_FORM:
      return Object.assign({}, state, action.payload)
    case MINIMIZE_COUNT_SHOP_FORM:
      return Object.assign({}, state, action.payload)
    default:
      return state
  }
}