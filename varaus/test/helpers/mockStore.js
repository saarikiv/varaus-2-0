/**
 * Redux mock store setup for testing action creators and async thunks.
 * Uses redux-mock-store with redux-thunk middleware.
 */
import { configureStore as configureMockStore } from 'redux-mock-store';
import thunk from 'redux-thunk';

const middlewares = [thunk];
const createMockStore = configureMockStore(middlewares);

/**
 * Default initial state matching the full Redux store shape.
 * Mirrors the combinedReducer in src/dev/reducers/combinedReducer.js.
 */
export const defaultState = {
  auth: {
    uid: null,
    email: null,
    userdata: null,
    error: null,
    timeout: false,
    emailUpdated: false,
    passwordUpdated: false
  },
  currentUser: {
    key: '',
    firstname: '',
    lastname: '',
    alias: '',
    email: '',
    locked: false,
    roles: { admin: false, instructor: false },
    bookingsReady: false,
    transactionsReady: false,
    bookings: [],
    history: [],
    transactions: {
      time: 0,
      count: 0,
      firstexpire: 0,
      details: { valid: [], expired: [], oneTime: [] }
    },
    error: null
  },
  timetable: {
    slots: [],
    bookings: {}
  },
  slotInfo: {},
  shopItems: {
    cart: {},
    items: [],
    phase: 'start',
    initializedTransaction: '0',
    authCode: '',
    purchaseResult: {},
    token: '',
    error: null
  },
  loadingScreen: {
    inTimeout: false,
    visible: false,
    context: '',
    success: undefined
  },
  pendingTransactions: [],
  userOverview: {
    userList: [],
    usersReady: false,
    credits: {},
    refreshRequired: false
  },
  terms: [],
  infoList: [],
  form: {},
  userList: [],
  adminList: [],
  slotList: [],
  shopList: [],
  slotForm: {},
  shopItemCountForm: {},
  infoForm: {},
  termsList: [],
  termsForm: {},
  searchBar: { query: '' },
  diagnostics: {
    sessionKey: 0,
    started: false,
    user: '',
    userAgent: '',
    events: {},
    flushed: false
  },
  ddata: {}
};

/**
 * Create a mock Redux store with optional state overrides.
 * @param {Object} overrides - Partial state to merge with defaults
 * @returns {Object} Mock store instance with getActions(), dispatch(), getState()
 */
export function makeMockStore(overrides = {}) {
  return createMockStore({ ...defaultState, ...overrides });
}

export default createMockStore;
