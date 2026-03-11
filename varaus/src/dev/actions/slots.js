import {
    FETCH_TIMETABLE,
    PUT_SLOT_INFO,
    REMOVE_SLOT_INFO,
    FLAG_SLOT_INFO_TO_EXIT
} from './actionTypes.js'

import {
    hasTimePassed,
    getSlotTimeLocal
} from '../helpers/timeHelper.js'

import {
    sortSlotsByStartTime,
    mergeCancelledSlots
} from '../helpers/slotHelper.js'

/**
 * Applies cancellation info to a single slot by checking whether the current
 * or next-week instance has a matching entry in the cancelled slot record.
 *
 * Mutates the slot object in place — sets `cancelled` and `cancelInfo` when
 * a matching instance timestamp is found.
 *
 * @param {Object} slot - Slot object with `day` (ISO 1-7) and `start` (ms from midnight)
 * @param {Object} cancelledSlot - Map of instance timestamps to cancellation info
 */
function processCancel(slot, cancelledSlot) {
    let weekIndex = hasTimePassed(slot.day, slot.start) ? 1 : 0;
    let instance = getSlotTimeLocal(weekIndex, slot.start, slot.day);
    if (cancelledSlot[instance.getTime()]) {
        slot.cancelInfo = cancelledSlot[instance.getTime()];
        slot.cancelInfo.instance = instance.getTime();
        slot.cancelled = true;
    }
}

/**
 * Sets up real-time Firebase listeners on `/slots/` and `/cancelledSlots/`.
 * Whenever either path changes, the full timetable is re-fetched and dispatched.
 *
 * Call {@link stopFetchTimetable} to remove these listeners when the timetable
 * view unmounts.
 *
 * @returns {Function} Redux thunk
 * @see stopFetchTimetable
 */
export function fetchTimetable() {
    return dispatch => {
        firebase.database().ref('/cancelledSlots/').on('value', () => {
            _fetchTimetable(dispatch);
        });
        firebase.database().ref('/slots/').on('value', () => {
            _fetchTimetable(dispatch);
        });
    }
}

/**
 * Removes the real-time Firebase listeners on `/slots/` and `/cancelledSlots/`
 * that were set up by {@link fetchTimetable}.
 *
 * Should be called when the timetable view unmounts to prevent memory leaks
 * and unnecessary re-fetches.
 *
 * @returns {Function} Redux thunk
 * @see fetchTimetable
 */
export function stopFetchTimetable() {
    return dispatch => {
        firebase.database().ref('/cancelledSlots/').off('value');
        firebase.database().ref('/slots/').off('value');
    }
}

/**
 * Fetches the current timetable by reading `/cancelledSlots/` and `/slots/`
 * from Firebase, merging cancellation data, sorting by start time, and
 * dispatching a FETCH_TIMETABLE action.
 *
 * This is an internal helper called by the real-time listeners in
 * {@link fetchTimetable}. It is exported for testability.
 *
 * @param {Function} dispatch - Redux dispatch function
 */
export function _fetchTimetable(dispatch) {
    var list = [];
    var cancelled = {};
    firebase.database().ref('/cancelledSlots/').once('value')
        .then(snapshot => {
            cancelled = snapshot.val();
            return firebase.database().ref('/slots/').once('value');
        })
        .then(snapshot => {
            var slots = snapshot.val();
            for (var key in slots) {
                slots[key].key = key;
                list = list.concat(slots[key]);
            }
            mergeCancelledSlots(list, cancelled, processCancel);
            list = sortSlotsByStartTime(list);
            dispatch({
                type: FETCH_TIMETABLE,
                payload: {
                    slots: list
                }
            });
        })
        .catch(error => {
            console.error("fetchTimetable failed:", error);
        });
}

/**
 * Dispatches slot selection info and associated bookings to the Redux store.
 * Called when a user selects a slot in the timetable.
 *
 * @param {Object} slot - The selected slot object
 * @param {Object} booking - Booking data for the selected slot
 * @returns {Function} Redux thunk
 */
export function putSlotInfo(slot, booking) {
    return dispatch => {
        dispatch({
            type: PUT_SLOT_INFO,
            payload: slot
        });
        dispatch({
            type: PUT_SLOT_INFO,
            payload: {
                bookings: booking
            }
        });
    }
}

/**
 * Flags the slot info panel for exit animation before removal.
 *
 * @returns {Object} Redux action with type FLAG_SLOT_INFO_TO_EXIT
 */
export function flagSlotInfoToExit() {
    return {
        type: FLAG_SLOT_INFO_TO_EXIT
    }
}

/**
 * Removes the currently selected slot info from the Redux store.
 *
 * @returns {Object} Redux action with type REMOVE_SLOT_INFO
 */
export function removeSlotInfo() {
    return {
        type: REMOVE_SLOT_INFO
    }
}
