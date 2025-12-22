import {
    CHANGE_LOADINGSCREEN_STATE
} from './actionTypes.js'

export function showLoadingScreen(context) {
    return dispatch => {
        _showLoadingScreen(dispatch, context)
    }
}

export function _showLoadingScreen(dispatch, context) {
    dispatch({
        type: CHANGE_LOADINGSCREEN_STATE,
        payload: {
            inTimeout: false,
            visible: true,
            context,
            success: "undefined"
        }
    });
}

export function hideLoadingScreen(context, success, timeout = 1000) {
    return dispatch => {
        _hideLoadingScreen(dispatch, context, success, timeout)
    }
}

export function _hideLoadingScreen(dispatch, context, success, timeout = 1000) {
    dispatch({
        type: CHANGE_LOADINGSCREEN_STATE,
        payload: {
            inTimeout: true,
            visible: true,
            context,
            success
        }
    });
    setTimeout(() => {
        dispatch({
            type: CHANGE_LOADINGSCREEN_STATE,
            payload: {
                inTimeout: false,
                visible: false,
                context,
                success
            }
        });
    }, timeout)
}