import {
    FETCH_USER_LIST,
    FETCH_ADMIN_LIST,
    FETCH_SLOT_LIST,
    FETCH_SHOP_LIST,
    FETCH_INFO_LIST,
    STOP_FETCH_INFO_LIST,
    FETCH_TERMS_LIST,
    STOP_FETCH_TERMS_LIST,
    STOP_FETCH_SHOP_LIST,

    EXPAND_ADMIN_LIST,
    MINIMIZE_ADMIN_LIST,
    EXPAND_USER_LIST,
    MINIMIZE_USER_LIST,
    EXPAND_SLOT_LIST,
    MINIMIZE_SLOT_LIST,
    EXPAND_SHOP_LIST,
    MINIMIZE_SHOP_LIST,
    EXPAND_INFO_LIST,
    MINIMIZE_INFO_LIST,
    EXPAND_TERMS_LIST,
    MINIMIZE_TERMS_LIST,

    EXPAND_SLOT_FORM,
    MINIMIZE_SLOT_FORM,
    EXPAND_COUNT_SHOP_FORM,
    MINIMIZE_COUNT_SHOP_FORM,
    EXPAND_TERMS_FORM,
    MINIMIZE_TERMS_FORM,
    EXPAND_INFO_FORM,
    MINIMIZE_INFO_FORM
} from './actionTypes.js'
import {
    toMilliseconds
} from '../helpers/timeHelper.js'
import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'

export function fetchUserList() {
    return dispatch => {
        _fetchUserList(dispatch)
    }
}

function _fetchUserList(dispatch) {
    var userList = Object.assign([])
    var adminList = Object.assign([])
    var specialusers = Object.assign({})
    var users = Object.assign({})
    _showLoadingScreen(dispatch, "Päivitetään käyttäjät")
    firebase.database().ref('/users/').once('value')
        .then(snapshot => {
            users = snapshot.val()
            return firebase.database().ref('/specialUsers/').once('value')
        })
        .then(snapshot => {
            specialusers = snapshot.val()
            for (var key in users) {
                users[key].key = key
                userList = userList.concat(users[key])
                if (specialusers[key]) {
                    if (specialusers[key].admin) {
                        adminList = adminList.concat(users[key])
                    }
                }
            }
            userList.sort((a, b) => {
                const aName = (a.firstname || '').toUpperCase();
                const bName = (b.firstname || '').toUpperCase();
                return aName < bName ? -1 : aName > bName ? 1 : 0;
            });
            dispatch({
                type: FETCH_USER_LIST,
                payload: userList
            });
            adminList.sort((a, b) => {
                const aName = (a.firstname || '').toUpperCase();
                const bName = (b.firstname || '').toUpperCase();
                return aName < bName ? -1 : aName > bName ? 1 : 0;
            });
            dispatch({
                type: FETCH_ADMIN_LIST,
                payload: adminList
            });
            _hideLoadingScreen(dispatch, "Käyttäjät päivitetty", true);
        })
        .catch(err => {
            console.error("ADMIN_ERR: fetch users fetchUserList: ", err);
            _hideLoadingScreen(dispatch, "Käyttäjien päivityksessä tapahtui virhe: " + err.toString(), false)
        })
}

export function stopFetchSlotList() {
    return dispatch => {
        firebase.database().ref('/slots/').off('value');
        dispatch({
            type: FETCH_SLOT_LIST,
            payload: {
                list: []
            }
        });
    }
}

export function fetchSlotList() {
    var list = []
    var returnObject = {}
    return dispatch => {
        firebase.database().ref('/slots/').on('value', snapshot => {
            var slots = snapshot.val()
            list = Object.assign([])
            for (var key in slots) {
                if (slots.hasOwnProperty(key)) {
                    let ItemWithKey = slots[key]
                    ItemWithKey.key = key
                    list = list.concat(ItemWithKey)
                }
            }
            list.sort(function (a, b) {
                if (a.day && b.day) {
                    return a.day - b.day
                }
                return 1
            })
            returnObject = Object.assign({}, {
                list: list
            })
            dispatch({
                type: FETCH_SLOT_LIST,
                payload: returnObject
            })
        }, err => {
            console.error("ERR: fetch slots: ", err);
        })
    }
}


export function fetchShopList() {
    var list = []
    return dispatch => {
        var returnObject = {}
        firebase.database().ref('/shopItems/').on('value', snapshot => {
            var shopItems = snapshot.val()
            list = Object.assign([])
            for (var key in shopItems) {
                if (shopItems.hasOwnProperty(key)) {
                    let ItemWithKey = shopItems[key]
                    ItemWithKey.key = key
                    list = list.concat(ItemWithKey)
                }
            }
            list.sort(function (a, b) {
                if (a.price && b.price) {
                    return a.price - b.price
                }
                return 0
            })
            returnObject = Object.assign({}, {
                list: list
            })
            dispatch({
                type: FETCH_SHOP_LIST,
                payload: returnObject
            })
        }, err => {
            console.error("ERR: fetch shopList: ", err);
        })
    }
}

export function stopFetchShopList() {
    return dispatch => {
        firebase.database().ref('/shopItems/').off('value');
        dispatch({
            type: STOP_FETCH_SHOP_LIST,
            payload: {
                list: Object.assign([])
            }
        })
    }
}


export function fetchTermsList() {
    var list = []

    return dispatch => {
        var returnObject = {}
        firebase.database().ref('/terms/').on('value', snapshot => {
            var termItems = snapshot.val()
            list = Object.assign([])
            for (var key in termItems) {
                    termItems[key].key = key
                    list = list.concat(termItems[key])
            }
            returnObject = Object.assign({}, {
                list: list
            })
            dispatch({
                type: FETCH_TERMS_LIST,
                payload: returnObject
            })
        }, err => {
            console.error("ERR: fetch terms: ", err);
        })
    }
}

export function stopFetchTermsList() {
    return dispatch => {
        firebase.database().ref('/terms/').off('value');
        dispatch({
            type: FETCH_TERMS_LIST,
            payload: {
                list: Object.assign([])
            }
        })
    }
}

export function removeTermsItem(item) {
    return dispatch => {
        firebase.database().ref('/terms/' + item.key).remove().then(() => {

        }).catch(err => {
            console.error("Removing terms item falied: ", err)
        })
    }
}


export function fetchInfoList() {
    var list = []

    return dispatch => {
        var returnObject = {}
        firebase.database().ref('/infoItems/').on('value', snapshot => {
            var infoItems = snapshot.val()
            list = Object.assign([])
            for (var key in infoItems) {
                if (infoItems.hasOwnProperty(key)) {
                    let ItemWithKey = infoItems[key]
                    ItemWithKey.key = key
                    list = list.concat(ItemWithKey)
                }
            }
            returnObject = Object.assign({}, {
                list: list
            })
            dispatch({
                type: FETCH_INFO_LIST,
                payload: returnObject
            })
        }, err => {
            console.error("ERR: fetch infoItems: ", err);
        })
    }
}

export function stopFetchInfoList() {
    return dispatch => {
        firebase.database().ref('/infoItems/').off('value');
        dispatch({
            type: FETCH_INFO_LIST,
            payload: {
                list: Object.assign([])
            }
        })
    }
}

export function removeInfoItem(item) {
    return dispatch => {
        firebase.database().ref('/infoItems/' + item.key).remove().then(() => {

        }).catch(err => {
            console.error("Removing info item falied: ", err)
        })
    }
}


export function removeSlot(key) {
    return dispatch => {
        firebase.database().ref('/slots/' + key).remove().then(() => {

        }).catch(err => {
            console.error("Removing slot failed: ", err)
        })
    }
}


export function addSlot(data) {

    return dispatch => {
        firebase.database().ref('/slots/').push({
            start: toMilliseconds(parseInt(data.start)),
            end: toMilliseconds(parseInt(data.end)),
            day: parseInt(data.day),
            blocked: data.blocked || false,
            reserver: data.reserver || ""
        })
    }
}

export function modifySlot(data, key) {
    return dispatch => {
        firebase.database().ref('/slots/' + key).update({
            start: toMilliseconds(parseInt(data.start)),
            end: toMilliseconds(parseInt(data.end)),
            day: parseInt(data.day),
            blocked: data.blocked || false,
            reserver: data.reserver || ""
        })
    }
}


export function addShopItem(data, type) {
    const beforetax = data.price / (1 + (data.taxpercent / 100))
    const taxamount = data.price - beforetax

    return dispatch => firebase.database().ref('/shopItems/' + data.title).update({
        type: type,
        title: data.title,
        desc: data.desc,
        usetimes: data.usetimes || null,
        usedays: data.usedays || null,
        expiresAfterDays: data.expiresAfterDays || null,
        price: Number(data.price.toFixed(2)),
        taxamount: Number(taxamount.toFixed(2)),
        taxpercent: Number(data.taxpercent.toFixed(2)),
        beforetax: Number(beforetax.toFixed(2)),
        oneTime: data.oneTime || false
    })
        .catch(err => {
            console.error("ERR: update; addShopItem: ", err);
        })
}

export function modifyShopItem(data, type) {
    const beforetax = data.price / (1 + (data.taxpercent / 100))
    const taxamount = data.price - beforetax

    return dispatch => firebase.database().ref('/shopItems/' + data.title).update({
        type: type,
        title: data.title,
        desc: data.desc,
        usetimes: data.usetimes || null,
        usedays: data.usedays || null,
        expiresAfterDays: data.expiresAfterDays || null,
        price: Number(data.price.toFixed(2)),
        taxamount: Number(taxamount.toFixed(2)),
        taxpercent: Number(data.taxpercent.toFixed(2)),
        beforetax: Number(beforetax.toFixed(2)),
        oneTime: data.oneTime || false
    })
        .catch(err => {
            console.error("ERR: update; addShopItem: ", err);
        })
}

export function addInfo(data) {
    return dispatch => firebase.database().ref('/infoItems/').push({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: addInfo: ", err);
        })
}

export function modifyInfo(key, data) {
    return dispatch => firebase.database().ref('/infoItems/' + key).update({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: modifyInfo: ", err);
        })
}

export function addTerms(data) {
    return dispatch => firebase.database().ref('/terms/').push({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: addterms: ", err);
        })
}

export function modifyTerms(key, data) {
    return dispatch => firebase.database().ref('/terms/' + key).update({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: modifyTerms: ", err);
        })
}


export function lockUser(key) {
    return dispatch => firebase.database().ref('/users/' + key).update({
        locked: true,
        instructor: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: update; lockUser: ", err);
        })
}

export function unlockUser(key) {
    return dispatch => firebase.database().ref('/users/' + key).update({
        locked: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: update; unlockUser: ", err);
        })
}

export function lockShopItem(key) {
    return dispatch => firebase.database().ref('/shopItems/' + key).update({
        locked: true
    })
        .catch(err => {
            console.error("ERR: update; lockShopItem: ", err);
        })
}

export function unlockShopItem(key) {
    return dispatch => firebase.database().ref('/shopItems/' + key).update({
        locked: null
    })
        .catch(err => {
            console.error("ERR: update; unlockShopItem: ", err);
        })
}

export function makeAdmin(key) {
    return dispatch => firebase.database().ref('/specialUsers/' + key).update({
        admin: true
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: update; makeAdmin: ", err);
        })
}

export function unmakeAdmin(key) {
    return dispatch => firebase.database().ref('/specialUsers/' + key).update({
        admin: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: update; unmakeAdmin: ", err);
        })
}

export function expandAdminList() {
    return dispatch => {
        dispatch({
            type: EXPAND_ADMIN_LIST
        })
    }
}

export function minimizeAdminList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_ADMIN_LIST
        })
    }
}

export function expandUserList() {
    return dispatch => {
        dispatch({
            type: EXPAND_USER_LIST
        })
    }
}

export function minimizeUserList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_USER_LIST
        })
    }
}

export function expandSlotList() {
    return dispatch => {
        dispatch({
            type: EXPAND_SLOT_LIST
        })
    }
}

export function minimizeSlotList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_SLOT_LIST
        })
    }
}


export function expandShopList() {
    return dispatch => {
        dispatch({
            type: EXPAND_SHOP_LIST
        })
    }
}

export function minimizeShopList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_SHOP_LIST
        })
    }
}

export function expandSlotForm(expander) {
    return dispatch => {
        dispatch({
            type: EXPAND_SLOT_FORM,
            payload: {
                expanded: true,
                expander: expander
            }
        })
    }
}

export function minimizeSlotForm() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_SLOT_FORM,
            payload: {
                expanded: false,
                expander: ""
            }
        })
    }
}


export function expandCountShopForm(expander) {
    return dispatch => {
        dispatch({
            type: EXPAND_COUNT_SHOP_FORM,
            payload: {
                expanded: true,
                expander: expander
            }
        })
    }
}

export function minimizeCountShopForm() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_COUNT_SHOP_FORM,
            payload: {
                expanded: false,
                expander: ""
            }
        })
    }
}

export function expandInfoList() {
    return dispatch => {
        dispatch({
            type: EXPAND_INFO_LIST
        })
    }
}

export function minimizeInfoList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_INFO_LIST
        })
    }
}

export function expandInfoForm(expander) {
    return dispatch => {
        dispatch({
            type: EXPAND_INFO_FORM,
            payload: {
                expanded: true,
                expander: expander
            }
        })
    }
}

export function minimizeInfoForm() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_INFO_FORM,
            payload: {
                expanded: false,
                expander: ""
            }
        })
    }
}

export function expandTermsList() {
    return dispatch => {
        dispatch({
            type: EXPAND_TERMS_LIST
        })
    }
}

export function minimizeTermsList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_TERMS_LIST
        })
    }
}

export function expandTermsForm(expander) {
    return dispatch => {
        dispatch({
            type: EXPAND_TERMS_FORM,
            payload: {
                expanded: true,
                expander: expander
            }
        })
    }
}

export function minimizeTermsForm() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_TERMS_FORM,
            payload: {
                expanded: false,
                expander: ""
            }
        })
    }
}