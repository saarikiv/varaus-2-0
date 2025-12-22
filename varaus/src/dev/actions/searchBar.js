import {
    CHANGE_SEARCH_BAR
} from './actionTypes.js'

export function changeSearch(value) {
    return dispatch => {
        dispatch({
            type: CHANGE_SEARCH_BAR,
            payload: { value }
        })
    }
}