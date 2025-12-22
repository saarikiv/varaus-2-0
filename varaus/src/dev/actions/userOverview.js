import {
    ADD_USERS_TO_OVERVIEW,
    ADD_CREDITS_TO_OVERVIEW
} from './actionTypes.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'


export function fetchUsersToOverview(){
    var userList = Object.assign([])
    return dispatch => {
        _showLoadingScreen(dispatch, "Haetaan käyttäjät")
        firebase.database().ref('/users/').once('value')
        .then( snapshot => {
            let users = snapshot.val()
            for(let user in users){
                userList = userList.concat(users[user])
                fetchTransactionsToOverview(dispatch, user)
            }
            dispatch({
                type: ADD_USERS_TO_OVERVIEW,
                payload: {
                    userList: userList,
                    usersReady: true
                }
            })
            _hideLoadingScreen(dispatch, "Käyttäjät haettu", true)
        })
        .catch(err => {
            console.error("Virhe käyttäjien hakemisessa: ", err);
            _hideLoadingScreen(dispatch, "Käyttäjien hakemisessa tapahtui virhe", false, 4000)
        })
    }
}


function fetchTransactionsToOverview(dispatch ,uid) {
    var transactions = null;
    firebase.database().ref('/transactions/' + uid).once('value')
    .then( snapshot => {
        var trx = {
            time: 0,
            count: 0,
            firstexpire: 0,
            details: {
                valid: [],
                expired: [],
                special: [],
                oneTime: []
            }
        };
        let now = Date.now();
        let all = snapshot.val();
        let one;
        var trxdetails = {};
        for (one in all) {
            trxdetails = Object.assign({}); //Need new object to be pushed to arrays
            trxdetails.purchasetime = one;
            trxdetails.type = all[one].type;
            trxdetails.paymentReceived = all[one].paymentReceived;
            trxdetails.expires = all[one].expires;
            trxdetails.paymentInstrumentType = all[one].details.transaction.paymentInstrumentType;
            trxdetails.shopItem = all[one].shopItem;
            trxdetails.shopItemKey = all[one].shopItemKey;
            trxdetails.oneTime = all[one].oneTime || false;
            switch (all[one].type) {
                case "time":
                    if (all[one].expires > now) {
                        trx.time = all[one].expires;
                    }
                    break;
                case "count":
                    trxdetails.unusedtimes = all[one].unusedtimes;
                    trxdetails.usetimes = all[one].usetimes;
                    if (all[one].expires > now) {
                        trx.count += all[one].unusedtimes;
                        if (all[one].expires < trx.firstexpire || trx.firstexpire === 0) {
                            if (all[one].unusedtimes > 0) {
                                trx.firstexpire = all[one].expires;
                            }
                        }
                    }
                    break;
                case "special":
                    //Placeholder for any special handling of specials
                    break;
                default:
                    console.error("undefined transaction type: ", uid, all[one].type, all[one]);
                    break;
            }
            if (all[one].type === "special") {
                trx.details.special.push(trxdetails);
            } else {
                if (trxdetails.expires > now) {
                    trx.details.valid.push(trxdetails);
                } else {
                    trx.details.expired.push(trxdetails);
                }
                if (trxdetails.oneTime) {
                    trx.details.oneTime.push(trxdetails.shopItemKey)
                }
            }
        }
        trx.details.valid.sort((a, b) => {
            return a.expires - b.expires
        });
        trx.details.expired.sort((a, b) => {
            return a.expires - b.expires
        });

        dispatch({
            type: ADD_CREDITS_TO_OVERVIEW,
            payload: {
                user: uid,
                credits: trx
            }
        })
    })
    .catch( error => {
        console.error("Fetching transactions failed: ", uid, error);
    })
}

