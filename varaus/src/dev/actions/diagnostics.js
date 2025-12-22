
import {
    CONFIGURE_DIAGNOSTICS,
    FLUSH_DIAGNOSTICS,
    FETCH_DIAGNOSTICS,
    USER_AGENT
} from './actionTypes.js'

import {
    _hideLoadingScreen,
    _showLoadingScreen
} from './loadingScreen.js'


function processDDataToNumOfEvents(rawData){
    var returnData = Object.assign([])
    let combinedEventData = Object.assign({})
    for(let sessions in rawData){
        if(rawData[sessions].events){
            for(let event in rawData[sessions].events){
                let newSessions = Object.assign({})
                for(let eventsession in rawData[sessions].events[event]){
                    newSessions = Object.assign({},newSessions,{[eventsession]: rawData[sessions].events[event][eventsession]})
                }
                let sessionsSofar = combinedEventData[event] || {};
                let allSessions = Object.assign({}, sessionsSofar, newSessions)
                combinedEventData = Object.assign({}, combinedEventData, {[event]: allSessions} )
            }
        }
    }
    for(let event in combinedEventData){
        let processedData = processDDataToSessions(combinedEventData[event])
        returnData = returnData.concat({[event]: processedData})
    }
    return {eventSessions: returnData};
}
function processDDataToSessions(rawData){
    var hourlySessions = Object.assign([])
    var dailySessions = Object.assign([])
    let hour = -1;
    let hourly = 0;
    let day = -1;
    let daily = 0;
    let hourtime = new Date();
    let daytime = new Date();
    let hx;
    let dx;
    for (let session in rawData) {
        hourtime.setTime(session);
        hourtime.setMinutes(0)
        hourtime.setSeconds(0)
        hourtime.setMilliseconds(0)
        daytime.setTime(session);
        daytime.setHours(12)
        daytime.setMinutes(0)
        daytime.setSeconds(0)
        daytime.setMilliseconds(0)
        hourly++;
        daily++;
        if(hour !== hourtime.getHours()){
            if(hour !== -1){
                hourlySessions = hourlySessions.concat({x: hx, y: hourly});
                hourly = 0;
            }
            hour = hourtime.getHours()
            hx = hourtime.toISOString().slice(0,16);
        }
        if(day !== daytime.getDate()){
            if(day !== -1){
                dailySessions = dailySessions.concat({x: dx, y: daily});
                daily = 0;
            }
            day = daytime.getDate()
            dx = daytime.toISOString().slice(0,10);
        }
    }
    if(hour !== -1 && hourly > 0){
        hourlySessions = hourlySessions.concat({x: hx, y: hourly});
    }
    if(day !== -1 && daily > 0){
        dailySessions = dailySessions.concat({x: dx, y: daily});
    }
    return {sessions: { dailySessions, hourlySessions} };
}

export function fetchDiagnostics(startDate, endDate){
    return dispatch => {
        var returnObject = Object.assign({})
        _showLoadingScreen(dispatch, "Haetaan diagnostiikkadataa.")
        firebase.database().ref('/diagnostics/').orderByKey().startAt(String(startDate)).endAt(String(endDate)).once('value')
        .then( snapshot => {
            var rawData = snapshot.val();
            var sessionData = processDDataToSessions(rawData)
            returnObject = Object.assign({}, returnObject, sessionData);
            returnObject = Object.assign({}, returnObject,processDDataToNumOfEvents(snapshot.val()));

            _hideLoadingScreen(dispatch, "Haku valmis", true)
            dispatch({
                type: FETCH_DIAGNOSTICS,
                payload: {
                    dataReady:true,
                    data: returnObject
                }
            })
        })
        .catch( error => {
            console.error("FETCHDATA ERROR:", error);
            _hideLoadingScreen(dispatch, "Haku valmis", true)
        })
    }
}

export function diag(type, payload){
    return dispatch => {
        _diag(dispatch, type, payload)
    }
}

export function _diag(dispatch, type, payload){
        dispatch({
            type,
            payload
        })
}


export function startDiagnostics() {
    return dispatch => {
      dispatch({
        type: CONFIGURE_DIAGNOSTICS,
        payload: {started: true, sessionKey: Date.now()}
      })
      dispatch({
        type: USER_AGENT,
        payload: {userAgent: document.defaultView.navigator.userAgent}
      })
    }
}
export function flushDiagnostics(diag) {
    return dispatch => {
        _flushDiagnostics(dispatch, diag)
    }
}

function _flushDiagnostics(dispatch) {
        dispatch({
            type: FLUSH_DIAGNOSTICS
        })
        dispatch({
            type: CONFIGURE_DIAGNOSTICS,
            payload: { flushed: true}
        })
}

export function flushDiagnosticsAtInterval(milliseconds) {
    return dispatch => {
        dispatch({
            type: CONFIGURE_DIAGNOSTICS,
            payload: { flushed: false}
        })
        setTimeout(() => {
            _flushDiagnostics(dispatch)
        }, milliseconds);
    }
}
