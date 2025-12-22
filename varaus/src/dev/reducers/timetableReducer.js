import { 
  FETCH_TIMETABLE, 
  FETCH_SLOT_BOOKINGS 
} from '../actions/actionTypes.js'

const INITIAL_STATE = {
  slots: [],
  bookings: {}
}

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case FETCH_SLOT_BOOKINGS:
        var bookings = Object.assign({},state.bookings, action.payload)
        return Object.assign({}, state, {bookings: bookings});
    case FETCH_TIMETABLE:
      return Object.assign({}, state, action.payload);
    default:
      return state
  }
}
