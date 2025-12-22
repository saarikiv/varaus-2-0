import * as actions from '../actions/actionTypes.js'

const INITIAL_STATE = {
    sessionKey: "0",
    started: false,
    user: "0",
    userAgent: "not yet defined",
    events: {},
    flushed: false
}

//Add events to be included here
var approvedEvents = {
    BUY_DELAYED: true,
    REMOVE_TRANSACTION: true,
    REMOVE_TRANSACTION_ERROR: true,
    REGISTER_USER: true,
    BOOK_A_SLOT: true,
    LATE_BOOK_A_SLOT: true,
    UPDATE_USER_DETAILS: true,
    FINISH_WITH_PAYTRAIL: true,
    GET_AUTH_CODE: true,
    BOOKING_ERROR: true,
    CANCEL_SLOT: true,
    SLOT_CANCEL_ERROR: true,
    CANCEL_ERROR: true,
    CANCEL_RESERVATION: true,
    EMAIL_UPDATED: true,
    PASSWORD_UPDATED: true,
    ACTIVATE_SLOT: true,
    ACTIVATION_FAILED: true,
    SIGN_OUT: true,
    CHECKOUT_ERROR: true,
    START_CHECKOUT_FLOW: true,
    BUY_WITH_CASH: true,
    BUY_WITH_PAYTRAIL: true,
    EXECUTE_CASH_PURCHASE: true,
    ADD_TO_CART: true,
    AUTH_ERROR: true,
    PASSWORD_RESET: true,
    VERIFY_EMAIL: true,
    RESET_SHOP: true,
    DO_PURCHASE_TRANSACTION: true,
    USER_ERROR: true,
    INSTRUCTOR_ERROR: true,
    SEND_FEEDBABCK: true
}

export default function(state = INITIAL_STATE, action) {

    switch (action.type) {
        case actions.CONFIGURE_DIAGNOSTICS:
            return Object.assign({},state, action.payload)
        case actions.FLUSH_DIAGNOSTICS:
            if(state.started && state.sessionKey !== "0"){
                firebase.database().ref('/diagnostics/'+state.sessionKey).update({user: state.user, ua: state.userAgent})
                .catch(error => {
                    console.error("diagnostics user write to firebase failed");
                })
                for(let event in state.events){
                    let instances = state.events[event];
                    for(let timestamp in instances){
                        firebase.database().ref('/diagnostics/'+state.sessionKey+'/events/'+event+'/'+timestamp).update(instances[timestamp]||{payload: 0})
                        .catch(error => {
                            console.error("flushing diagnostics events to firebase failed");
                        })
                    }
                }
            }
            return Object.assign({}, state, {events: {}})
        default:
            if(state.started){
                //Filter only the actions we know of.
                if(actions[action.type]){
                    return Object.assign({}, state, processAction(state, action))
                }
            }
            return state
    }
}

function processAction(state, action){
    let timestamp = Date.now();
    let returnObject = Object.assign({})
    let eventObject = Object.assign({})
    /////////
    if(action.type === actions.ADD_USER && state.user === "0"){
        returnObject = Object.assign({},returnObject, { user: action.payload.uid})
        return returnObject;
    }
    if(action.type === actions.USER_AGENT){
        returnObject = Object.assign({},returnObject, { userAgent: action.payload.userAgent})
        return returnObject;
    }
    /////////
    // Here we can filter only those events, which we are interested in
    /////////
    if(approvedEvents[action.type]){
        let list = {}
        let events = state.events;
        if(events[action.type]){
            list = Object.assign(events[action.type], {[timestamp]: action.payload});
        } else{
            list = Object.assign({[timestamp]: action.payload});
        }
        eventObject = Object.assign({}, events, {[action.type]: list})
        returnObject = Object.assign({}, {events: eventObject})
    }
    return returnObject;
}
