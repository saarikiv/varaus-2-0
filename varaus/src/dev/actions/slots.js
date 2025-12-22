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

function processCancel(slot, cancelledSlot){
    let weekIndex = (hasTimePassed(slot.day, slot.start))? 1 : 0;
    let instance = getSlotTimeLocal(weekIndex, slot.start, slot.day)
    if(cancelledSlot[instance.getTime()]){
        slot.cancelInfo = cancelledSlot[instance.getTime()];
        slot.cancelInfo.instance = instance.getTime();
        slot.cancelled = true;
    }
}

export function fetchTimetable(){
    return dispatch => {
        firebase.database().ref('/cancelledSlots/').on('value', snapshot => {
            _fetchTimetable(dispatch);
        });
        firebase.database().ref('/slots/').on('value', snapshot => {
            _fetchTimetable(dispatch);
        });
    }
}

export function stopFetchTimetable(){
    return dispatch => {
        firebase.database().ref('/cancelledSlots/').off('value');
        firebase.database().ref('/slots/').off('value');        
    }
}

export function _fetchTimetable(dispatch) {
    var list = Object.assign([])
    var cancelled = {}
    firebase.database().ref('/cancelledSlots/').once('value')
    .then(snapshot => {
        cancelled = snapshot.val()
        return firebase.database().ref('/slots/').once('value');
    })
    .then( snapshot => {
        var slots = snapshot.val()
        for (var key in slots) {
            slots[key].key = key
            slots[key].cancelled = false; //This will be overwritten in processCancel if called
            if(cancelled){
                if(cancelled[key]){
                    processCancel(slots[key], cancelled[key]);
                }
            }
            list = list.concat(slots[key])
        }
        list.sort(function(a, b) {
            if (a.start && b.start) {
                return a.start - b.start
            }
            return 0
        })
        dispatch({
            type: FETCH_TIMETABLE,
            payload: {
                slots: list
            }
        })
    })
    .catch(error => {
        console.error("FetchTimetable failed:", error);
    })
}

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

export function flagSlotInfoToExit(){
    return {
        type: FLAG_SLOT_INFO_TO_EXIT
    }
}

export function removeSlotInfo() {
    return {
        type: REMOVE_SLOT_INFO
    }
}