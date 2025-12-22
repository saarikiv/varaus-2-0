import axios from "axios"

import {
    ADD_USER,
    REMOVE_USER,
    AUTH_ERROR,
    AUTH_TIMEOUT,
    EMAIL_UPDATED,
    PASSWORD_UPDATED,
    SIGN_OUT,
    REGISTER_USER
} from './actionTypes.js'
import {
    createNewUser
} from './user.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'

const Auth = firebase.auth();

let firstName = null;
let surname = null;
let alias = null;

export function waitForMilliseconds(milliseconds) {
    return dispatch => {
        setTimeout(() => {
            dispatch({
                type: AUTH_TIMEOUT,
                payload: {
                    timeout: true
                }
            })
        }, milliseconds);
    }
}

export function authListener() {
    return dispatch => {
        Auth.onAuthStateChanged(userdata => {
            if (userdata) {
                var user = {}
                user.email = userdata.email;
                user.uid = userdata.uid;
                user.userdata = userdata;
                //console.log("USER: ", user.uid, user.email, userdata);
                dispatch({
                    type: ADD_USER,
                    payload: user
                })
                createNewUser(user, firstName, surname, alias);
                firstName = null;
                surname = null;
                alias = null;
            } else {
                dispatch({
                    type: REMOVE_USER
                })
            }
        })
    }
}

export function loginWithPopUp() {
    return dispatch => {
        var provider = new firebase.auth.GoogleAuthProvider
        Auth.signInWithPopup(provider).catch(error => {
            if (error) {
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
        });
    }
}

export function login(email, password) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Kirjataan käyttäjä sisään sovellukseen"); // loading screen is cleared in AuthManager.jsx after user data is fully loaded.
        Auth.signInWithEmailAndPassword(email, password).catch(error => {
            if (error) {
                dispatch({
                    type: AUTH_ERROR,
                    payload: {
                        error: {
                            code: error.code,
                            message: error.message
                        }
                    }
                })
                _hideLoadingScreen(dispatch, "Tarkista käyttäjätunnus/salasana\nOletko rekisteröitynyt?", false, 3000)
            }
        });
    }
}

export function logout() {
    return dispatch => {
        Auth.signOut().then(() => {
          dispatch({
            type: SIGN_OUT
          })
        }, error => {
            if (error) {
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
        });
    }

}

function sendRegistrationNotification(){
    let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/notifyRegistration' : VARAUSSERVER + '/notifyRegistration'
    firebase.auth().currentUser.getToken(true)
    .then(idToken => {
        return axios.post(VARAUSURL, {
            current_user: idToken
        })
    })
    .then(response => {
    })
    .catch(error => {
        console.error("REGISTRATION_NOTIFICATION_ERROR:", error);
    });
}

export function register(email, password, fName, sName, a) {

    firstName = fName;
    surname = sName;
    alias = a;

    return dispatch => {
        _showLoadingScreen(dispatch, "Rekisteröidään käyttäjää " + email)
        Auth.createUserWithEmailAndPassword(email, password).then(() => {
            _hideLoadingScreen(dispatch, "Käyttäjä " + email + " onnistuneesti rekisteröity", true)
            dispatch({
              type: REGISTER_USER
            })
            setTimeout(()=>{
                sendRegistrationNotification();
            },2000)
        }).catch(error => {
            if (error) {
                dispatch({
                    type: AUTH_ERROR,
                    payload: {
                        error: {
                            code: error.code,
                            message: error.message
                        }
                    }
                })
                _hideLoadingScreen(dispatch, "Käyttäjän " + email + "rekisteröinti epäonnistui: " + error.toString(), false, 3000)
            }
        });
    }
}

//TODO: this does not work.... Weird errors....
export function updateEmailAddress(oldEmail, oldPdw, newEmail) {
    console.log("AUTH: change of email:", oldEmail, oldPdw, newEmail)
    return dispatch => {
        var credential = firebase.auth.EmailAuthProvider.credential(oldEmail, oldPdw);
        var user = firebase.auth().currentUser
        user.reauthenticate(credential).then(() => {
            user.updateEmail(newEmail).then(
                () => {
                    dispatch({
                        type: EMAIL_UPDATED,
                        payload: {
                            error: {
                                code: "0",
                                message: "no error"
                            },
                            emailUpdated: true
                        }
                    })
                }, (error) => {
                    if (error) {
                        console.error("UPDATE-EMAIL error", error)
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
                }
            )
        }, (error) => {
            if (error) {
                console.error("REAUTH error", error)
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
}

export function updatePassword(oldEmail, oldPdw, newPassword) {
    console.log("AUTH: change of pwd:", newPassword)
    return dispatch => {
        var credential = firebase.auth.EmailAuthProvider.credential(oldEmail, oldPdw);
        var user = firebase.auth().currentUser
        user.reauthenticate(credential).then(() => {
            user.updatePassword(newPassword).then(
                () => {
                    dispatch({
                        type: PASSWORD_UPDATED,
                        payload: {
                            error: {
                                code: "0",
                                message: "no error"
                            },
                            passwordUpdated: true
                        }
                    })
                }, (error) => {
                    if (error) {
                        console.error("auth error", error)
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
                }
            )
        }, (error) => {
            if (error) {
                console.error("REAUTH error", error)
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
}
