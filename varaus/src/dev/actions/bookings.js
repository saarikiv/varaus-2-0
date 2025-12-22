import axios from 'axios'

import {
    FETCH_SLOT_BOOKINGS,
    CHANGE_LOADINGSCREEN_STATE,
    BOOK_A_SLOT,
    LATE_BOOK_A_SLOT,
    BOOKING_ERROR,
    CANCEL_ERROR,
    CANCEL_RESERVATION
} from './actionTypes.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'


export function postCancellation(item, txRef, slotInfo) {
    var VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/cancelSlot' : VARAUSSERVER + '/cancelSlot'
    return dispatch => {
        _showLoadingScreen(dispatch, "Perutaan varausta")
        let now = new Date();
        firebase.auth().currentUser.getToken(true).then(idToken => {
            axios.post(
                    VARAUSURL, {
                        user: idToken,
                        slotInfo: slotInfo,
                        cancelItem: item,
                        transactionReference: txRef,
                        timezoneOffset: now.getTimezoneOffset() * 60 * 1000
                    })
                .then(response => {
                  dispatch({
                    type: CANCEL_RESERVATION,
                    payload: {slotInfo, txRef}
                  })
                    _hideLoadingScreen(dispatch, "Varaus peruttu", true)
                })
                .catch(error => {
                  dispatch({
                    type: CANCEL_ERROR,
                    payload: {error, slotInfo, txRef}
                  })
                    console.error(error);
                    _hideLoadingScreen(dispatch, "Varauksen perumisesa tapahtui virhe: " + error.data, false)
                });
        }).catch(error => {
            console.error("Failde to get authentication token for current user: ", error);
            _hideLoadingScreen(dispatch, "Varauksen perumisesa tapahtui virhe: " + error.toString(), false)
        });
    }
}


export function postReservation(forward, slotInfo) {
    var VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/reserveSlot' : VARAUSSERVER + '/reserveSlot'
    return dispatch => {
        _showLoadingScreen(dispatch, "Varataan vuoroa")
        let now = new Date();
        firebase.auth().currentUser.getToken(true).then(idToken => {
            axios.post(
                    VARAUSURL, {
                        user: idToken,
                        slotInfo: slotInfo,
                        weeksForward: forward,
                        timezoneOffset: now.getTimezoneOffset() * 60 * 1000
                    })
                .then(response => {
                  dispatch({
                    type: BOOK_A_SLOT,
                    payload: {slotInfo}
                  })
                    _hideLoadingScreen(dispatch, "Varaus onnistui", true)
                })
                .catch(error => {
                  dispatch({
                    type: BOOKING_ERROR,
                    payload: {error, slotInfo}
                  })
                    console.error(error);
                    _hideLoadingScreen(dispatch, "Varauksen tekemisessä tapahtui virhe: " + error.data, false)
                });
        }).catch(error => {
            console.error("Failde to get authentication token for current user: ", error);
            _hideLoadingScreen(dispatch, "Varauksen tekemisessä tapahtui virhe: " + error.toString(), false)
        });
    }
}

function processBookings(inputBookings, uid, bookings, userbookings, slot) {
    let instanceId;
    let instanceObj;
    let booking = {}
    let user;
    let index = 0;
    for (instanceId in inputBookings) {
        //Booking is in the future - it counts!!
        let referenceTime = Number(instanceId) + slot.end - slot.start
        if (referenceTime > Date.now()) {
            booking.instance = instanceId;
            booking.reservations = 0;
            booking.participants = [];
            instanceObj = inputBookings[instanceId];
            for (user in instanceObj) {
                booking.reservations++;
                booking.participants.push({
                    key: user,
                    name: instanceObj[user].user,
                    transactionReference: instanceObj[user].transactionReference
                });
                if (user === uid) {
                    userbookings.push(Object.assign({
                        item: instanceId,
                        txRef: instanceObj[user].transactionReference
                    }));
                }
            }
            bookings.push(Object.assign({}, booking))
            index++;
        }
    }
    userbookings.sort((a, b) => {
        return a.item - b.item
    });
    bookings.sort((a, b) => {
        return a.instance - b.instance
    })
}

export function fetchSlotBookings(slot, uid) {
    var bookings = []
    var userbookings = []
    return dispatch => {
        var bkns = {}
        var returnObject;
        //Clear the booking details in case there are no bookings and the
        firebase.database().ref('/bookingsbyslot/' + slot.key).on('value', snapshot => {
            bkns = snapshot.val();
            bookings = Object.assign([]);
            userbookings = Object.assign([]);
            processBookings(bkns, uid, bookings, userbookings, slot)
            returnObject = Object.assign({})
            returnObject[slot.key] = {
                all: bookings,
                user: userbookings
            }
            dispatch({
                type: FETCH_SLOT_BOOKINGS,
                payload: returnObject
            })
        }, err => {
            console.error("Error is fetching bookingsbyslot: ", err);
        });
    }
}

export function stopfetchSlotBookings(slotkey) {
    return dispatch => {
        firebase.database().ref('/bookingsbyslot/' + slotkey).off('value');
    }
}
