import PropTypes from 'prop-types'
import React from "react"

// Polyfill for legacy React.PropTypes - MUST be set before any other imports
React.PropTypes = PropTypes;

import { createRoot } from "react-dom/client"
import { HashRouter } from 'react-router-dom'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'

import reducer from "./dev/reducers/combinedReducer.js"
import AppRoutes from "./routes.jsx"
require('./styles/app.scss');

console.log('App starting...');

try {
  const store = createStore(reducer, applyMiddleware(thunk));
  console.log('Store created:', store);

  const app = document.getElementById('app');
  console.log('App element:', app);
  
  const root = createRoot(app);
  console.log('Root created:', root);
  
  root.render(
    <Provider store={store}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </Provider>
  );
  console.log('App rendered');
} catch (error) {
  console.error('Error starting app:', error);
  document.getElementById('app').innerHTML = '<h1>Error: ' + error.message + '</h1><pre>' + error.stack + '</pre>';
}

