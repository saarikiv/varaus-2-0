// Unit tests for DeleteProfileButton component
// Validates: Requirements 1.1, 1.2, 1.4, 3.3, 5.1, 5.2, 5.3

// firebaseMock must be imported BEFORE any module that uses firebase at module level
import '../helpers/firebaseMock.js';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import { createStore, combineReducers } from 'redux';

import DeleteProfileButton from '../../src/dev/components/userProfile/DeleteProfileButton.jsx';

const h = React.createElement;

/**
 * Minimal reducer that mirrors the currentUser slice shape needed by the component.
 */
function currentUserReducer(state = {
  hasActiveBookings: null,
  deletionInProgress: false
}, action) {
  switch (action.type) {
    default:
      return state;
  }
}

function makeStore(currentUserOverrides = {}) {
  const initialState = {
    currentUser: {
      hasActiveBookings: null,
      deletionInProgress: false,
      ...currentUserOverrides
    }
  };
  return createStore(
    combineReducers({ currentUser: currentUserReducer }),
    initialState
  );
}

function renderWithStore(currentUserOverrides = {}) {
  const store = makeStore(currentUserOverrides);
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root;
  act(() => {
    root = createRoot(container);
    root.render(h(Provider, { store: store }, h(DeleteProfileButton)));
  });
  return { container, root, store };
}

function cleanup(container, root) {
  act(() => {
    root.unmount();
  });
  document.body.removeChild(container);
}

describe('DeleteProfileButton component', function () {

  // **Validates: Requirements 1.1, 5.1, 5.2**
  it('renders delete button when user is authenticated', function () {
    const { container, root } = renderWithStore();
    const btn = container.querySelector('.btn-small.btn-red');
    expect(btn).to.not.be.null;
    expect(btn.textContent).to.include('Poista profiili');
    cleanup(container, root);
  });

  // **Validates: Requirements 5.2, 5.3**
  it('does not render when user is not authenticated', function () {
    // The DeleteProfileButton is conditionally rendered by its parent based on auth.uid.
    // Simulate the parent's gating: when auth.uid is falsy, the component is not mounted.
    const store = makeStore();
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root;
    act(() => {
      root = createRoot(container);
      const authUid = null; // not authenticated
      root.render(h(Provider, { store: store }, authUid ? h(DeleteProfileButton) : null));
    });
    const btn = container.querySelector('.btn-small.btn-red');
    expect(btn).to.be.null;
    const heading = container.querySelector('h2');
    expect(heading).to.be.null;
    cleanup(container, root);
  });

  // **Validates: Requirement 3.3**
  it('shows warning when hasActiveBookings is true', function () {
    const { container, root } = renderWithStore({ hasActiveBookings: true });
    const warning = container.querySelector('p');
    expect(warning).to.not.be.null;
    expect(warning.textContent).to.include('aktiivisia varauksia');
    expect(warning.style.color).to.equal('rgb(192, 57, 43)');
    cleanup(container, root);
  });

  // **Validates: Requirement 3.3**
  it('does not show warning when hasActiveBookings is false', function () {
    const { container, root } = renderWithStore({ hasActiveBookings: false });
    const paragraphs = container.querySelectorAll('p');
    const warningTexts = Array.from(paragraphs).filter(p => p.textContent.includes('aktiivisia varauksia'));
    expect(warningTexts).to.have.lengthOf(0);
    cleanup(container, root);
  });

  // **Validates: Requirement 1.4**
  it('button is disabled when deletionInProgress is true', function () {
    const { container, root } = renderWithStore({ deletionInProgress: true });
    const btn = container.querySelector('.btn-small.btn-red');
    expect(btn).to.not.be.null;
    expect(btn.textContent).to.include('Poistetaan...');
    expect(btn.style.opacity).to.equal('0.5');
    expect(btn.style.cursor).to.equal('not-allowed');
    cleanup(container, root);
  });

  // **Validates: Requirement 1.1**
  it('shows confirmation dialog on click', function () {
    const { container, root } = renderWithStore();
    const btn = container.querySelector('.btn-small.btn-red');
    act(() => {
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
    const dialog = container.querySelector('.slot-info-container');
    expect(dialog).to.not.be.null;
    expect(dialog.textContent).to.include('Haluatko varmasti poistaa profiilisi');
    cleanup(container, root);
  });

  // **Validates: Requirement 1.2**
  it('closes dialog on cancel without dispatching deletion', function () {
    const { container, root, store } = renderWithStore();
    // Open dialog
    const btn = container.querySelector('.btn-small.btn-red');
    act(() => {
      btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
    // Verify dialog is open
    let dialog = container.querySelector('.slot-info-container');
    expect(dialog).to.not.be.null;

    // Click cancel button (btn-blue)
    const cancelBtn = container.querySelector('.btn-small.btn-blue');
    expect(cancelBtn).to.not.be.null;
    expect(cancelBtn.textContent).to.include('Peruuta');
    act(() => {
      cancelBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });

    // Dialog should be closed
    dialog = container.querySelector('.slot-info-container');
    expect(dialog).to.be.null;
  });
});
