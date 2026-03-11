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

/**
 * Fetch the full user list and admin list from Firebase.
 * Uses `once('value')` (no persistent listener).
 * @returns {Function} Redux thunk action
 */
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

/**
 * Stop listening for real-time slot list updates and clear the slot list.
 * Calls `ref.off('value')` on `/slots/` to detach the Firebase listener.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Fetch the slot list from Firebase `/slots/` with a real-time listener.
 * Call {@link stopFetchSlotList} to detach the listener when no longer needed.
 * @returns {Function} Redux thunk action
 */
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
            _hideLoadingScreen(dispatch, "Aikojen haussa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Fetch the shop item list from Firebase `/shopItems/` with a real-time listener.
 * Call {@link stopFetchShopList} to detach the listener when no longer needed.
 * @returns {Function} Redux thunk action
 */
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
            _hideLoadingScreen(dispatch, "Kauppatuotteiden haussa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Stop listening for real-time shop item list updates and clear the list.
 * Calls `ref.off('value')` on `/shopItems/` to detach the Firebase listener.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Fetch the terms list from Firebase `/terms/` with a real-time listener.
 * Call {@link stopFetchTermsList} to detach the listener when no longer needed.
 * @returns {Function} Redux thunk action
 */
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
            _hideLoadingScreen(dispatch, "Ehtojen haussa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Stop listening for real-time terms list updates and clear the list.
 * Calls `ref.off('value')` on `/terms/` to detach the Firebase listener.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Remove a terms item from Firebase `/terms/`.
 * @param {Object} item - The terms item to remove (must have a `key` property)
 * @returns {Function} Redux thunk action
 */
export function removeTermsItem(item) {
    return dispatch => {
        firebase.database().ref('/terms/' + item.key).remove().then(() => {

        }).catch(err => {
            console.error("ERR: removeTermsItem: ", err);
            _hideLoadingScreen(dispatch, "Ehdon poistossa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Fetch the info item list from Firebase `/infoItems/` with a real-time listener.
 * Call {@link stopFetchInfoList} to detach the listener when no longer needed.
 * @returns {Function} Redux thunk action
 */
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
            _hideLoadingScreen(dispatch, "Tietojen haussa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Stop listening for real-time info item list updates and clear the list.
 * Calls `ref.off('value')` on `/infoItems/` to detach the Firebase listener.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Remove an info item from Firebase `/infoItems/`.
 * @param {Object} item - The info item to remove (must have a `key` property)
 * @returns {Function} Redux thunk action
 */
export function removeInfoItem(item) {
    return dispatch => {
        firebase.database().ref('/infoItems/' + item.key).remove().then(() => {

        }).catch(err => {
            console.error("ERR: removeInfoItem: ", err);
            _hideLoadingScreen(dispatch, "Tiedon poistossa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Remove a slot from Firebase `/slots/`.
 * @param {string} key - The Firebase key of the slot to remove
 * @returns {Function} Redux thunk action
 */
export function removeSlot(key) {
    return dispatch => {
        firebase.database().ref('/slots/' + key).remove().then(() => {

        }).catch(err => {
            console.error("ERR: removeSlot: ", err);
            _hideLoadingScreen(dispatch, "Ajan poistossa tapahtui virhe: " + err.toString(), false);
        })
    }
}

/**
 * Add a new slot to Firebase `/slots/`.
 * @param {Object} data - Slot data with start, end, day, blocked, and reserver fields
 * @returns {Function} Redux thunk action
 */
export function addSlot(data) {

    return dispatch => {
        firebase.database().ref('/slots/').push({
            start: toMilliseconds(parseInt(data.start)),
            end: toMilliseconds(parseInt(data.end)),
            day: parseInt(data.day),
            blocked: data.blocked || false,
            reserver: data.reserver || ""
        })
            .catch(err => {
                console.error("ERR: addSlot: ", err);
                _hideLoadingScreen(dispatch, "Ajan lisäyksessä tapahtui virhe: " + err.toString(), false);
            })
    }
}

/**
 * Modify an existing slot in Firebase `/slots/`.
 * @param {Object} data - Updated slot data with start, end, day, blocked, and reserver fields
 * @param {string} key - The Firebase key of the slot to modify
 * @returns {Function} Redux thunk action
 */
export function modifySlot(data, key) {
    return dispatch => {
        firebase.database().ref('/slots/' + key).update({
            start: toMilliseconds(parseInt(data.start)),
            end: toMilliseconds(parseInt(data.end)),
            day: parseInt(data.day),
            blocked: data.blocked || false,
            reserver: data.reserver || ""
        })
            .catch(err => {
                console.error("ERR: modifySlot: ", err);
                _hideLoadingScreen(dispatch, "Ajan muokkauksessa tapahtui virhe: " + err.toString(), false);
            })
    }
}

/**
 * Add a new shop item to Firebase `/shopItems/`.
 * @param {Object} data - Shop item data with title, desc, price, taxpercent, and optional fields
 * @param {string} type - The shop item type ('time', 'count', or 'special')
 * @returns {Function} Redux thunk action
 */
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
            console.error("ERR: addShopItem: ", err);
            _hideLoadingScreen(dispatch, "Kauppatuotteen lisäyksessä tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Modify an existing shop item in Firebase `/shopItems/`.
 * @param {Object} data - Updated shop item data
 * @param {string} type - The shop item type ('time', 'count', or 'special')
 * @returns {Function} Redux thunk action
 */
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
            console.error("ERR: modifyShopItem: ", err);
            _hideLoadingScreen(dispatch, "Kauppatuotteen muokkauksessa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Add a new info item to Firebase `/infoItems/`.
 * @param {Object} data - Info item data with title and content fields
 * @returns {Function} Redux thunk action
 */
export function addInfo(data) {
    return dispatch => firebase.database().ref('/infoItems/').push({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: addInfo: ", err);
            _hideLoadingScreen(dispatch, "Tiedon lisäyksessä tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Modify an existing info item in Firebase `/infoItems/`.
 * @param {string} key - The Firebase key of the info item to modify
 * @param {Object} data - Updated info item data with title and content fields
 * @returns {Function} Redux thunk action
 */
export function modifyInfo(key, data) {
    return dispatch => firebase.database().ref('/infoItems/' + key).update({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: modifyInfo: ", err);
            _hideLoadingScreen(dispatch, "Tiedon muokkauksessa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Add a new terms item to Firebase `/terms/`.
 * @param {Object} data - Terms item data with title and content fields
 * @returns {Function} Redux thunk action
 */
export function addTerms(data) {
    return dispatch => firebase.database().ref('/terms/').push({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: addTerms: ", err);
            _hideLoadingScreen(dispatch, "Ehdon lisäyksessä tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Modify an existing terms item in Firebase `/terms/`.
 * @param {string} key - The Firebase key of the terms item to modify
 * @param {Object} data - Updated terms item data with title and content fields
 * @returns {Function} Redux thunk action
 */
export function modifyTerms(key, data) {
    return dispatch => firebase.database().ref('/terms/' + key).update({
        title: data.title,
        content: data.content
    })
        .catch(err => {
            console.error("ERR: modifyTerms: ", err);
            _hideLoadingScreen(dispatch, "Ehdon muokkauksessa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Lock a user by setting `locked: true` on their `/users/` record and clearing instructor flag.
 * Refreshes the user list after the update.
 * @param {string} key - The Firebase UID of the user to lock
 * @returns {Function} Redux thunk action
 */
export function lockUser(key) {
    return dispatch => firebase.database().ref('/users/' + key).update({
        locked: true,
        instructor: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: lockUser: ", err);
            _hideLoadingScreen(dispatch, "Käyttäjän lukitsemisessa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Unlock a user by removing the `locked` flag from their `/users/` record.
 * Refreshes the user list after the update.
 * @param {string} key - The Firebase UID of the user to unlock
 * @returns {Function} Redux thunk action
 */
export function unlockUser(key) {
    return dispatch => firebase.database().ref('/users/' + key).update({
        locked: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: unlockUser: ", err);
            _hideLoadingScreen(dispatch, "Käyttäjän avaaminen epäonnistui: " + err.toString(), false);
        })
}

/**
 * Lock a shop item by setting `locked: true` on its `/shopItems/` record.
 * @param {string} key - The Firebase key of the shop item to lock
 * @returns {Function} Redux thunk action
 */
export function lockShopItem(key) {
    return dispatch => firebase.database().ref('/shopItems/' + key).update({
        locked: true
    })
        .catch(err => {
            console.error("ERR: lockShopItem: ", err);
            _hideLoadingScreen(dispatch, "Kauppatuotteen lukitsemisessa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Unlock a shop item by removing the `locked` flag from its `/shopItems/` record.
 * @param {string} key - The Firebase key of the shop item to unlock
 * @returns {Function} Redux thunk action
 */
export function unlockShopItem(key) {
    return dispatch => firebase.database().ref('/shopItems/' + key).update({
        locked: null
    })
        .catch(err => {
            console.error("ERR: unlockShopItem: ", err);
            _hideLoadingScreen(dispatch, "Kauppatuotteen avaaminen epäonnistui: " + err.toString(), false);
        })
}

/**
 * Grant admin privileges to a user by setting `admin: true` on their `/specialUsers/` record.
 * Refreshes the user list after the update.
 * @param {string} key - The Firebase UID of the user to make admin
 * @returns {Function} Redux thunk action
 */
export function makeAdmin(key) {
    return dispatch => firebase.database().ref('/specialUsers/' + key).update({
        admin: true
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: makeAdmin: ", err);
            _hideLoadingScreen(dispatch, "Admin-oikeuksien myöntämisessä tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Revoke admin privileges from a user by removing the `admin` flag from their `/specialUsers/` record.
 * Refreshes the user list after the update.
 * @param {string} key - The Firebase UID of the user to remove admin from
 * @returns {Function} Redux thunk action
 */
export function unmakeAdmin(key) {
    return dispatch => firebase.database().ref('/specialUsers/' + key).update({
        admin: null
    })
        .then(() => {
            _fetchUserList(dispatch)
        })
        .catch(err => {
            console.error("ERR: unmakeAdmin: ", err);
            _hideLoadingScreen(dispatch, "Admin-oikeuksien poistossa tapahtui virhe: " + err.toString(), false);
        })
}

/**
 * Expand the admin list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandAdminList() {
    return dispatch => {
        dispatch({
            type: EXPAND_ADMIN_LIST
        })
    }
}

/**
 * Minimize the admin list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeAdminList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_ADMIN_LIST
        })
    }
}

/**
 * Expand the user list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandUserList() {
    return dispatch => {
        dispatch({
            type: EXPAND_USER_LIST
        })
    }
}

/**
 * Minimize the user list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeUserList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_USER_LIST
        })
    }
}

/**
 * Expand the slot list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandSlotList() {
    return dispatch => {
        dispatch({
            type: EXPAND_SLOT_LIST
        })
    }
}

/**
 * Minimize the slot list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeSlotList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_SLOT_LIST
        })
    }
}

/**
 * Expand the shop list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandShopList() {
    return dispatch => {
        dispatch({
            type: EXPAND_SHOP_LIST
        })
    }
}

/**
 * Minimize the shop list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeShopList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_SHOP_LIST
        })
    }
}

/**
 * Expand the slot form in the admin view.
 * @param {string} expander - Identifier for the form expander context
 * @returns {Function} Redux thunk action
 */
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

/**
 * Minimize the slot form in the admin view.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Expand the count shop item form in the admin view.
 * @param {string} expander - Identifier for the form expander context
 * @returns {Function} Redux thunk action
 */
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

/**
 * Minimize the count shop item form in the admin view.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Expand the info list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandInfoList() {
    return dispatch => {
        dispatch({
            type: EXPAND_INFO_LIST
        })
    }
}

/**
 * Minimize the info list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeInfoList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_INFO_LIST
        })
    }
}

/**
 * Expand the info form in the admin view.
 * @param {string} expander - Identifier for the form expander context
 * @returns {Function} Redux thunk action
 */
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

/**
 * Minimize the info form in the admin view.
 * @returns {Function} Redux thunk action
 */
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

/**
 * Expand the terms list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function expandTermsList() {
    return dispatch => {
        dispatch({
            type: EXPAND_TERMS_LIST
        })
    }
}

/**
 * Minimize the terms list panel in the admin view.
 * @returns {Function} Redux thunk action
 */
export function minimizeTermsList() {
    return dispatch => {
        dispatch({
            type: MINIMIZE_TERMS_LIST
        })
    }
}

/**
 * Expand the terms form in the admin view.
 * @param {string} expander - Identifier for the form expander context
 * @returns {Function} Redux thunk action
 */
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

/**
 * Minimize the terms form in the admin view.
 * @returns {Function} Redux thunk action
 */
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
