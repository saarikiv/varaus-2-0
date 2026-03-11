import { 
  FETCH_TIMETABLE, 
  FETCH_SLOT_BOOKINGS 
} from '../actions/actionTypes.js'

/**
 * @typedef {Object} TimetableState
 * @property {Array<{key: string, day: number, start: number, end: number, blocked: boolean, reserver: string, cancelled: boolean, cancelInfo: Object|null}>} slots
 *   Sorted array of sauna time slots (ascending by start time).
 * @property {Object<string, {all: Array, user: Array}>} bookings
 *   Bookings keyed by slot key, each containing all-user and current-user bookings.
 */

/** @type {TimetableState} */
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
