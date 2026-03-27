import axios from "axios"

import {
    UPDATE_USERS_BOOKINGS,
    UPDATE_USERS_TRANSACTIONS,
    USER_ERROR,
    USER_DETAILS_UPDATED_IN_DB,
    STOP_UPDATING_USER_DETAILS_FROM_DB,
    SEND_FEEDBABCK,
    VERIFY_EMAIL,
    PASSWORD_RESET,
    UPDATE_USER_DETAILS,
    DELETE_PROFILE_REQUEST,
    DELETE_PROFILE_SUCCESS,
    DELETE_PROFILE_FAILURE,
    ACTIVE_BOOKINGS_CHECKED,
    SIGN_OUT
} from './actionTypes.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'

import { categorizeTransactions } from '../helpers/transactionHelper.js'


const Auth = firebase.auth();

var UserRef;
var TransactionsRef;
var BookingsRef;

export function sendFeedback(feedback){
  return dispatch => {
    //for diagnostics
    dispatch({
      type: SEND_FEEDBABCK
    })
    _showLoadingScreen(dispatch, "Lähetetään palaute")
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      _hideLoadingScreen(dispatch, "Virhe: Et ole kirjautunut sisään", false)
      dispatch({
        type: USER_ERROR,
        payload: {
          code: "auth/no-user",
          message: "Et ole kirjautunut sisään"
        }
      })
      return;
    }
    
    let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/feedback' : VARAUSSERVER + '/feedback'
    currentUser.getToken(true)
    .then(idToken => {
        return axios.post(VARAUSURL, {
            current_user: idToken,
            feedback_message: feedback
        })
    })
    .then(response => {
        _hideLoadingScreen(dispatch, "Palaute lähetetty", true)
    })
    .catch(error => {
        console.error("FEEDBACK_ERROR:", error);
        _hideLoadingScreen(dispatch, "Palautteen lähettämisessä tapahtui virhe: " + error.toString(), false)
        dispatch({
            type: USER_ERROR,
            payload: {
                error: {
                    code: "FEEDBACK_ERROR",
                    message: "Sending feedback failed: " + error.toString()
                }
            }
        })
    });


  }
}

export function updateUserDetails(user) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Päivitetään tiedot")
        firebase.database().ref('/users/' + user.uid).update(user)
            .then(() => {
              dispatch({
                type: UPDATE_USER_DETAILS
              })
                _hideLoadingScreen(dispatch, "Tiedot päivitetty", true)
            })
            .catch(error => {
                console.error("User details update failed: ", error)
                dispatch({
                    type: USER_ERROR,
                    payload: error
                })
                _hideLoadingScreen(dispatch, "Tietojen päivittämisessä tapahtui virhe: " + error.message, false)
            })
    }
}


export function fetchUsersBookings(uid) {
    return dispatch => {
        var oneSlot;
        var allSlots;
        var oneBooking;
        var allBookings;
        var booking = {};
        var returnListBookings = [];
        var returnListHistory = [];
        var slotInfo = {}
        firebase.database().ref('/slots/').once('value')
            .then(snapshot => {
                slotInfo = snapshot.val()
                BookingsRef = firebase.database().ref('/bookingsbyuser/' + uid);
                BookingsRef.on('value', snapshot => {
                    allSlots = snapshot.val();
                    returnListBookings = Object.assign([]);
                    returnListHistory = Object.assign([]);
                    if (allSlots) {
                        for (oneSlot in allSlots) {
                            allBookings = allSlots[oneSlot]
                            for (oneBooking in allBookings) {
                                booking = Object.assign({}, allBookings[oneBooking]);
                                booking.slot = oneSlot;
                                booking.slotInfo = slotInfo[oneSlot];
                                if (!booking.slotInfo) {
                                    dispatch({
                                        type: USER_ERROR,
                                        payload: {
                                            error: {
                                                code: "DB_INTEGRITY_ERR",
                                                message: "Referred slot is missing from database: " + oneSlot
                                            },
                                            bookingsReady: true
                                        }
                                    })
                                } else {
                                    booking.slotInfo.key = oneSlot;
                                    let referenceTime = booking.slotTime + booking.slotInfo.end - booking.slotInfo.start //Find the end time of the slot
                                    if (referenceTime < Date.now()) {
                                        returnListHistory.push(booking)
                                    } else {
                                        returnListBookings.push(booking);
                                    }
                                }
                            }
                        }
                        returnListBookings.sort((a, b) => {
                            return a.slotTime - b.slotTime
                        })
                        returnListHistory.sort((a, b) => {
                            return a.slotTime - b.slotTime
                        })
                    }
                    dispatch({
                        type: UPDATE_USERS_BOOKINGS,
                        payload: {
                            bookingsReady: true,
                            bookings: returnListBookings,
                            history: returnListHistory
                        }
                    })
                }, error => {
                    console.error("Failed getting bookings: ", uid, error);
                    dispatch({
                        type: USER_ERROR,
                        payload: {
                            error,
                            bookingsReady: true
                        }
                    })
                })
            }, error => {
                console.error("Failed getting slot info: ", uid, error);
                dispatch({
                    type: USER_ERROR,
                    payload: {
                        error,
                        bookingsReady: true
                    }
                })
            })
            .catch((error) => {
                console.error("Failed getting bookings: ", uid, error);
                dispatch({
                    type: USER_ERROR,
                    payload: {
                        error,
                        bookingsReady: true
                    }
                })
            })
    }
}

export function fetchUsersTransactions(uid) {
    return dispatch => {
        TransactionsRef = firebase.database().ref('/transactions/' + uid);
        TransactionsRef.on('value', snapshot => {
            const trx = categorizeTransactions(snapshot.val(), Date.now());

            dispatch({
                type: UPDATE_USERS_TRANSACTIONS,
                payload: {
                    transactionsReady: true,
                    transactions: trx
                }
            })
        }, error => {
            console.error("Fetching transactions failed: ", uid, error);
            dispatch({
                type: USER_ERROR,
                payload: {
                    transactionsReady: true,
                    error
                }
            })
        })
    }
}

export function fetchUserDetails(uid) {
    UserRef = firebase.database().ref('/users/' + uid);
    var usr = null;
    let tmp = null
    return dispatch => {
        UserRef.on('value', snapshot => {
            if (snapshot.val()) {
                usr = snapshot.val();
                usr.key = snapshot.key;
                firebase.database().ref('/specialUsers/' + usr.key).once('value')
                    .then(snapshot => {
                        usr.roles = {
                            admin: false,
                            instructor: false
                        }
                        if (snapshot.val()) {
                            if (snapshot.val().admin) {
                                usr.roles.admin = snapshot.val().admin
                            }
                            if (snapshot.val().instructor) {
                                usr.roles.instructor = snapshot.val().instructor
                            }
                            if (snapshot.val().tester) {
                                usr.roles.tester = snapshot.val().tester
                            }
                        }
                        dispatch({
                            type: USER_DETAILS_UPDATED_IN_DB,
                            payload: usr
                        })
                    })
            }
        }, err => {
            console.error("Getting user data failed: ", err);
            dispatch({
                type: USER_ERROR,
                payload: err
            })
        })
    }
}

export function finishedWithUserDetails() {
    if (UserRef) UserRef.off('value');
    if (TransactionsRef) TransactionsRef.off('value');
    if (BookingsRef) BookingsRef.off('value')
    return dispatch => {
        dispatch({
            type: STOP_UPDATING_USER_DETAILS_FROM_DB,
            payload: null
        })
    }
}

export function resetPassword(email) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Lähetetään salasanan uudelleen asetus viesti");
        firebase.auth().sendPasswordResetEmail(email).then(() => {
          dispatch({
            type: PASSWORD_RESET
          })
                _hideLoadingScreen(dispatch, "Viesti lähetetty", true);
            })
            .catch((error) => {
                console.error("Error from: sendPasswordResetEmail - ", error)
                dispatch({
                    type: USER_ERROR,
                    payload: {
                        error: {
                            code: "EMAIL_RESET_ERROR",
                            message: error.message
                        }
                    }
                })
                _hideLoadingScreen(dispatch, "Viestin lähetyksessä tapahtui virhe:" + error.message, false);
            })

    }
}

export function sendEmailVerification() {
    return dispatch => {
        _showLoadingScreen(dispatch, "Lähetetään verifiointilinkki sähköpostiisi")
        firebase.auth().currentUser.sendEmailVerification()
            .then(() => {
              dispatch({
                type: VERIFY_EMAIL
              })
                _hideLoadingScreen(dispatch, "Sähköposti lähetetty", true)
            })
            .catch((error) => {
                console.error("Error from: sendEmailVerification - ", error)
                dispatch({
                    type: USER_ERROR,
                    payload: {
                        error: {
                            code: "EMAIL_VERIFICATION_ERROR",
                            message: error.message
                        }
                    }
                })
                _hideLoadingScreen(dispatch, "Sähköpostin lähetyksessä tapahtui virhe: " + error.message, false)
            })
    }
}

export function createNewUser(user, firstname, lastname, alias) {
    firebase.database().ref('/users/' + user.uid).once('value').then(snapshot => {
        let existingUser = snapshot.val()
        if (existingUser === null) {
            if (firstname === null) {
                firstname = firebase.auth().currentUser.displayName;
            }
            return firebase.database().ref('/users/' + user.uid).update({
                email: user.email,
                uid: user.uid,
                firstname: firstname,
                lastname: lastname,
                alias: alias
            }).catch((error) => {
                if (error) {
                    console.error("Error writing new user to database", error);
                    dispatch({
                        type: AUTH_ERROR,
                        payload: {
                            error: {
                                code: error.code,
                                message: error.message
                            }
                        }
                    })
                }
            })
        }
    })
}

export function deleteProfile() {
    return dispatch => {
        _showLoadingScreen(dispatch, "Poistetaan profiilia")
        dispatch({ type: DELETE_PROFILE_REQUEST })

        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            _hideLoadingScreen(dispatch, "Virhe: Et ole kirjautunut sisään", false)
            dispatch({
                type: DELETE_PROFILE_FAILURE,
                payload: {
                    error: {
                        code: "auth/no-user",
                        message: "Et ole kirjautunut sisään"
                    }
                }
            })
            return;
        }

        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/deleteProfile' : VARAUSSERVER + '/deleteProfile'
        currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken
                })
            })
            .then(response => {
                dispatch({ type: DELETE_PROFILE_SUCCESS })
                _hideLoadingScreen(dispatch, "Profiili poistettu", true)
                firebase.auth().signOut().then(() => {
                    dispatch({ type: SIGN_OUT })
                })
            })
            .catch(error => {
                console.error("DELETE_PROFILE_ERROR:", error);
                if (error.response && error.response.status === 409) {
                    _hideLoadingScreen(dispatch, "Sinulla on aktiivisia varauksia. Peru varaukset ennen profiilin poistoa.", false)
                    dispatch({
                        type: DELETE_PROFILE_FAILURE,
                        payload: {
                            error: {
                                code: "ACTIVE_BOOKINGS",
                                message: "Sinulla on aktiivisia varauksia. Peru varaukset ennen profiilin poistoa."
                            }
                        }
                    })
                } else {
                    _hideLoadingScreen(dispatch, "Profiilin poistamisessa tapahtui virhe: " + error.toString(), false)
                    dispatch({
                        type: DELETE_PROFILE_FAILURE,
                        payload: {
                            error: {
                                code: "DELETE_PROFILE_ERROR",
                                message: error.response ? error.response.data.error : error.toString()
                            }
                        }
                    })
                }
            })
    }
}

export function checkActiveBookings(uid) {
    return dispatch => {
        firebase.database().ref('/slots/').once('value')
            .then(slotsSnapshot => {
                const slotInfo = slotsSnapshot.val() || {};
                return firebase.database().ref('/bookingsbyuser/' + uid).once('value')
                    .then(bookingsSnapshot => {
                        const allSlots = bookingsSnapshot.val();
                        let hasActive = false;
                        if (allSlots) {
                            for (let oneSlot in allSlots) {
                                const allBookings = allSlots[oneSlot];
                                const info = slotInfo[oneSlot];
                                if (!info) continue;
                                for (let oneBooking in allBookings) {
                                    const booking = allBookings[oneBooking];
                                    const referenceTime = booking.slotTime + info.end - info.start;
                                    if (referenceTime > Date.now()) {
                                        hasActive = true;
                                        break;
                                    }
                                }
                                if (hasActive) break;
                            }
                        }
                        dispatch({
                            type: ACTIVE_BOOKINGS_CHECKED,
                            payload: hasActive
                        })
                    })
            })
            .catch(error => {
                console.error("CHECK_ACTIVE_BOOKINGS_ERROR:", error);
                dispatch({
                    type: ACTIVE_BOOKINGS_CHECKED,
                    payload: false
                })
            })
    }
}
