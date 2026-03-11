import {
    CHANGE_LOADINGSCREEN_STATE
} from '../actions/actionTypes.js'

/**
 * Loading screen state shape.
 *
 * @typedef {Object} LoadingScreenState
 * @property {boolean} inTimeout - Whether the loading screen is in the auto-dismiss timeout phase
 * @property {boolean} visible - Whether the loading screen overlay is currently visible
 * @property {string} context - Descriptive message shown during the loading operation
 * @property {boolean|"undefined"} success - Operation result: true for success, false for error, "undefined" when pending
 *
 * State transitions:
 *   SHOW  → { visible: true, inTimeout: false, success: "undefined", context: <message> }
 *   HIDE  → { visible: true, inTimeout: true, success: true|false, context: <message> }
 *           then after timeout:
 *         → { visible: false, inTimeout: false, success: true|false, context: <message> }
 */

/** @type {LoadingScreenState} */
const INITIAL_STATE = {
    inTimeout: false,
    visible: false,
    context: "",
    success: "undefined"
}

/**
 * Reducer for the loading screen overlay state.
 *
 * Handles a single action type (CHANGE_LOADINGSCREEN_STATE) that merges
 * the action payload into the current state. The action creators
 * (_showLoadingScreen, _hideLoadingScreen) control the specific
 * field values for each transition.
 *
 * @param {LoadingScreenState} state - Current loading screen state
 * @param {{ type: string, payload?: Partial<LoadingScreenState> }} action - Redux action
 * @returns {LoadingScreenState} Updated state
 */
export default function loadingScreenReducer(state = INITIAL_STATE, action) {
    switch (action.type) {
        case CHANGE_LOADINGSCREEN_STATE:
            return Object.assign({}, state, action.payload);
        default:
            return state;
    }
}
