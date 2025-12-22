import axios from "axios"

import {
    OK_TRANSACTION,
    OK_TRANSACTION_ERROR,
    REMOVE_TRANSACTION,
    REMOVE_TRANSACTION_ERROR,
    START_CHECKOUT_FLOW,
    FETCH_SHOP_ITEMS,
    ADD_TO_CART,
    BUY_WITH_CASH,
    BUY_WITH_PAYTRAIL,
    DO_PURCHASE_TRANSACTION,
    CHECKOUT_ERROR,
    CHECKOUT_TIMEOUT,
    EXECUTE_CASH_PURCHASE,
    RESET_SHOP,
    BUY_DELAYED,
    FETCH_PENDING_TRANSACTIONS,
    FINISH_WITH_PAYTRAIL,
    GET_AUTH_CODE
} from './actionTypes.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'

const ShopItemsRef = firebase.database().ref('/shopItems/')

export function removeTransaction(transaction, user){
    return dispatch => {
        _showLoadingScreen(dispatch, "Perutaan osto.")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/removeTransaction' : VARAUSSERVER + '/removeTransaction'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    for_user: user,
                    transaction: transaction
                })
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Osto peruttu.", true)
                dispatch({
                    type: REMOVE_TRANSACTION,
                    payload:{transaction, user}
                })
            })
            .catch(error => {
                console.error("PAYTRAIL_ERROR:", error);
                _hideLoadingScreen(dispatch, "Oston perumisessa tapahtui virhe: " + error.data, false, 5000)
                dispatch({
                    type: REMOVE_TRANSACTION_ERROR,
                    payload:{transaction, user}
                })
            });

    }
}

export function okTransaction(transaction, user){
    return dispatch => {
        _showLoadingScreen(dispatch, "Kuitataan maksu saaduksi.")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/okTransaction' : VARAUSSERVER + '/okTransaction'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    for_user: user,
                    transaction: transaction
                })
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Maksu kuitattu.", true)
                dispatch({
                    type: OK_TRANSACTION,
                    payload:{transaction, user}
                })
            })
            .catch(error => {
                console.error("PAYTRAIL_ERROR:", error);
                _hideLoadingScreen(dispatch, "Maksun kuittaamisessa tapahtui virhe: " + error.data, false, 5000)
                dispatch({
                    type: OK_TRANSACTION_ERROR,
                    payload:{transaction, user}
                })
            });

    }
}


export function completePendingPayment(pendingTrxId){
    return dispatch => {
        _completePendingPayment(dispatch, pendingTrxId)
    }
}

function _completePendingPayment(dispatch, pendingTrxId){
            _showLoadingScreen(dispatch, "Hyväksytään osto")
    let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/approveincomplete' : VARAUSSERVER + '/approveincomplete'
    firebase.auth().currentUser.getToken(true)
        .then(idToken => {
            return axios.post(VARAUSURL, {
                current_user: idToken,
                pending_transaction_id: pendingTrxId
            })
        })
        .then(response => {
            _hideLoadingScreen(dispatch, "Osto hyväksytty", true)
        })
        .catch(error => {
            console.error("PAYTRAIL_ERROR:", error);
            _hideLoadingScreen(dispatch, "Oston hyväksymisessä tapahtui virhe: " + error.toString(), false)
            dispatch({
                type: CHECKOUT_ERROR,
                payload: {
                    error: {
                        code: "PAYTRAIL_ERROR",
                        message: "Paytrail complete error: " + error.toString()
                    }
                }
            })
        });

}


export function fetchPendingTransactions(){
    var list = [];
    return dispatch => {
        var returnObject = {}
        firebase.database().ref('/pendingtransactions/').on('value', snapshot => {
            list = Object.assign([])
            if(snapshot.val() !== null){
                let allTrx = snapshot.val();
                for(let key in allTrx){
                    allTrx[key].key = key;
                    list = list.concat(allTrx[key])
                }
            }
            returnObject = Object.assign({}, {
                list: list
            })
            dispatch({
                type: FETCH_PENDING_TRANSACTIONS,
                payload: returnObject
            });
        }, error => {
            console.error("Error in fetching pending transactions: ", error);
        })
    }
}

export function  stopFetchPendingTransactions(){
    return dispatch => {
        firebase.database().ref('/pendingtransactions/').off('value');
        dispatch({
            type: FETCH_PENDING_TRANSACTIONS,
            payload: {list: []}
        });
    }
}

export function resetShop(shopItems = null){
    return dispatch => {
        if(shopItems === null){
            dispatch({
                type: RESET_SHOP
            })
        } else {
            if(shopItems.initializedTransaction !== "0"){ //We need to clear the pending transaction.
                _cancelPaytrailPayment(dispatch, shopItems.initializedTransaction);
            }
        }
    }
}

export function buyWithPaytrail(pendingTrxId) {
    return dispatch => {
        dispatch({
            type: BUY_WITH_PAYTRAIL,
            payload: {
                phase: "payTrailPayment",
                error: {
                    code: "0",
                    message: "no error"
                }
            }
        })
    }
}

export function buyDelayed(pendingTrxId) {
    return dispatch => {
      _showLoadingScreen(dispatch, "Lähetetään lasku ostosta.")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/notifydelayed' : VARAUSSERVER + '/notifydelayed'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    transaction: pendingTrxId
                })
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Lasku lähetetty", true)
                dispatch({
                    type: BUY_DELAYED,
                    payload: {
                        phase: "delayedPayment",
                        initializedTransaction: "0",
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
                _completePendingPayment(dispatch, pendingTrxId)
            })
            .catch(error => {
                console.error("DELAYED_ERROR:", error);
                _hideLoadingScreen(dispatch, "Laskun lähettämisessä tapahtui virhe: " + error.data, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "DELAYED_ERROR",
                            message: "Notification error: " + error.data
                        }
                    }
                })
            })
    }
}


export function finishPayTrailTransaction(query){
        return dispatch => {
        _showLoadingScreen(dispatch, "Viimeistellään osto")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/completepaytrail' : VARAUSSERVER + '/completepaytrail'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    METHOD: query.METHOD,
                    ORDER_NUMBER: query.ORDER_NUMBER,
                    PAID: query.PAID,
                    RETURN_AUTHCODE: query.RETURN_AUTHCODE,
                    TIMESTAMP: query.TIMESTAMP
                })
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Osto valmis", true)
                dispatch({
                    type: FINISH_WITH_PAYTRAIL,
                    payload: {
                        phase: "payTrailComplete",
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("PAYTRAIL_ERROR:", error);
                _hideLoadingScreen(dispatch, "Oston viimeistelyssä tapahtui virhe: " + error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "PAYTRAIL_ERROR",
                            message: "Paytrail complete error: " + error
                        }
                    }
                })
            });
    }
}

export function getAuthCode(_authcode) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Haetaan tunnistekoodia")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/paytrailauthcode' : VARAUSSERVER + '/paytrailauthcode'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    auth_code: _authcode
                })
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Tunniste valmis", true)
                dispatch({
                    type: GET_AUTH_CODE,
                    payload: {
                        authCode: response.data,
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("AUTHCODE_ERROR:", error);
                _hideLoadingScreen(dispatch, "Tunnisteen hakemisessa tapahtui virhe: " + error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "AUTHCODE_ERROR",
                            message: "AuthCode error: " + error
                        }
                    }
                })
            });
    }
}

export function cancelPaytrailPayment(pendingTrxId, resetShop = true){
    return dispatch => {
        _cancelPaytrailPayment(dispatch, pendingTrxId, resetShop)
    }
}


function _cancelPaytrailPayment(dispatch, pendingTrxId, resetShop = true) {
    _showLoadingScreen(dispatch, "Perutaan PayTrail maksu")
    let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/cnacelpaytrailtransaction' : VARAUSSERVER + '/cancelpaytrailtransaction'

    firebase.auth().currentUser.getToken(true)
        .then(idToken => {
            return axios.post(VARAUSURL, {
                current_user: idToken,
                pending_transaction: pendingTrxId
            })
        })
        .then(result => {
            _hideLoadingScreen(dispatch, "Maksun peruminen onnistui", true)

            if(resetShop){
                dispatch({
                    type: RESET_SHOP
                })
            } else {
                //This is here for PaytrailCancel view needs. We need to clear location history.
                //View will call resetShop when unmounts.
                dispatch({
                    type: FINISH_WITH_PAYTRAIL,
                    payload: {
                        phase: "payTrailComplete",
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }                
                })
            }
        })
        .catch(error => {
            console.error("PURCHASE ERROR", error);
            _hideLoadingScreen(dispatch, "Maksun perumisessa tapahtui virhe: "+ error, false)
            dispatch({
                type: CHECKOUT_ERROR,
                payload: {
                    error: {
                        code: "PURCHASE_ERROR",
                        message: "Purchase error: " + error
                    }
                }
            })
        })
}

export function initializePayTrailTransaction(shopItem, type) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Alustetaan maksutapahtuma")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/initializepaytrailtransaction' : VARAUSSERVER + '/initializepaytrailtransaction'

        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    item_key: shopItem,
                    current_user: idToken,
                    purchase_target: type
                })
            })
            .then(result => {
                _hideLoadingScreen(dispatch, "Maksun alustus onnistui", true)
                dispatch({
                    type: DO_PURCHASE_TRANSACTION,
                    payload: {
                        phase: "payTrailInitialized",
                        initializedTransaction: result.data,
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("PURCHASE ERROR", error);
                _hideLoadingScreen(dispatch, "Maksun suorituksessa tapahtui virhe: "+ error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "PURCHASE_ERROR",
                            message: "Purchase error: " + error
                        }
                    }
                })
            })
    }
}

export function initializeDelayedTransaction(shopItem, type) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Alustetaan maksutapahtuma")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/initializedelayedtransaction' : VARAUSSERVER + '/initializedelayedtransaction'

        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    item_key: shopItem,
                    current_user: idToken,
                    purchase_target: type
                })
            })
            .then(result => {
                _hideLoadingScreen(dispatch, "Maksun alustus onnistui", true)
                dispatch({
                    type: DO_PURCHASE_TRANSACTION,
                    payload: {
                        phase: "delayedTransactionInitialized",
                        initializedTransaction: result.data,
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("PURCHASE ERROR", error);
                _hideLoadingScreen(dispatch, "Maksun suorituksessa tapahtui virhe: "+ error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "PURCHASE_ERROR",
                            message: "Purchase error: " + error
                        }
                    }
                })
            })
    }
}


export function buyWithCash() {
    return dispatch => {
        dispatch({
            type: BUY_WITH_CASH,
            payload: {
                phase: "cashPayment",
                error: {
                    code: "0",
                    message: "no error"
                }
            }
        })
    }
}

export function executeCashPurchase(forUsr, itemKey, type) {
    return dispatch => {

        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/cashbuy' : VARAUSSERVER + '/cashbuy'
        _showLoadingScreen(dispatch, "Käteisostoa suoritetaan")
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    for_user: forUsr,
                    item_key: itemKey,
                    current_user: idToken,
                    purchase_target: type
                })
            })
            .then(result => {
                _hideLoadingScreen(dispatch, "Käteisosto onnistui", true)
                dispatch({
                    type: EXECUTE_CASH_PURCHASE,
                    payload: {
                        cart: {},
                        phase: "done",
                        purchaseResult: result.data,
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("CASH ERROR", error);
                _hideLoadingScreen(dispatch, "Käteisostossa tapahtui virhe: " + error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "CASH_ERROR",
                            message: "Cash error: " + error
                        }
                    }
                })
            })
    }
}

export function waitForMilliseconds(milliseconds) {
    return dispatch => {
        setTimeout(() => {
            dispatch({
                type: CHECKOUT_TIMEOUT,
                payload: {
                    phase: "timeout"
                }
            })
        }, milliseconds);
    }
}

export function fetchShopItems(oneTime) {
    var list = Object.assign([])
    return dispatch => {
        _showLoadingScreen(dispatch, "Haetaan tuotteet")
        ShopItemsRef.once('value', snapshot => {
                var shopItems = snapshot.val()
                for (var key in shopItems) {
                    if (shopItems.hasOwnProperty(key) && !shopItems[key].locked) {
                        if( oneTime.find( listItem => { return listItem === key})){
                            //console.log("OneTimer already purchased");
                        } else {
                            let shopItemWithKey = shopItems[key]
                            shopItemWithKey.key = key
                            list = list.concat(shopItemWithKey)
                        }
                    }
                }
                _hideLoadingScreen(dispatch, "Tuotteet haettu", true)
                dispatch({
                    type: FETCH_SHOP_ITEMS,
                    payload: {
                        items: list
                    }
                })
            })
            .catch(err => {
                _hideLoadingScreen(dispatch, "Tuotteiden hakemisessa tapahtui virhe" + String(err), false)
                console.error("Cant read shopitems: ", err);
            })
    }
}

export function addToCart(item) {
    return dispatch => {
        dispatch({
            type: ADD_TO_CART,
            payload: {
                cart: item,
                error: {
                    code: "0",
                    message: "no error"
                }
            }
        })
    }
}

export function checkoutError(error) {
    return dispatch => {
        dispatch({
            type: CHECKOUT_ERROR,
            payload: {
                error: {
                    code: "CHECKOUT_ERR",
                    message: "Checkout error: " + error.toString()
                }
            }
        })
    }
}

export function removeShopItem(key) {
    return dispatch => ShopItemsRef.child(key).remove()
}

/*export function getClientTokenFromBraintree() {
    return dispatch => {
        _showLoadingScreen(dispatch, "Alustetaan maksuyhteyttä")
        dispatch({
            type: START_CHECKOUT_FLOW,
            payload: {
                phase: "braintreePayment",
            }
        })
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/clientToken' : VARAUSSERVER + '/clientToken'
        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.get(VARAUSURL + '?token=' + idToken)
            })
            .then(response => {
                _hideLoadingScreen(dispatch, "Maksuyhteys valmis", true)
                dispatch({
                    type: GET_CLIENT_TOKEN,
                    payload: {
                        token: response.data,
                        phase: "tokenReceived"
                    }
                })
            })
            .catch(error => {
                console.error("TOKEN_ERROR:", error);
                _hideLoadingScreen(dispatch, "Maksuyhteyden alustuksessa tapahtui virhe: " + error, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "TOKEN_ERROR",
                            message: "ClientToken error: " + error
                        }
                    }
                })
            });
    }
}*/

export function doPurchaseTransaction(shopItem) {
    return dispatch => {
        _showLoadingScreen(dispatch, "Lähetetään lasku sähköpostisi.")
        let VARAUSURL = typeof(VARAUSSERVER) === "undefined" ? 'http://localhost:3000/checkout' : VARAUSSERVER + '/checkout'

        firebase.auth().currentUser.getToken(true)
            .then(idToken => {
                return axios.post(VARAUSURL, {
                    current_user: idToken,
                    item_key: shopItem
                })
            })
            .then(result => {
                _hideLoadingScreen(dispatch, "Laskun lähetys onnistui", true)
                dispatch({
                    type: DO_PURCHASE_TRANSACTION,
                    payload: {
                        cart: {},
                        phase: "done",
                        purchaseResult: result.data,
                        error: {
                            code: "0",
                            message: "no error"
                        }
                    }
                })
            })
            .catch(error => {
                console.error("PURCHASE ERROR", error);
                _hideLoadingScreen(dispatch, "Laskun lähetyksessä tapahtui virhe: "+ error.data, false)
                dispatch({
                    type: CHECKOUT_ERROR,
                    payload: {
                        error: {
                            code: "PURCHASE_ERROR",
                            message: "Purchase error: " + error.data
                        }
                    }
                })
            })
    }
}
