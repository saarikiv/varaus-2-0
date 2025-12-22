import React from 'react';
import Router from 'react-router-dom';
import { connect } from 'react-redux'

class LoginRequired extends React.Component {
  static willTransitionTo(transition, params, query, callback) {
    if(!auth.email){
      // go over to login page
      transition.redirect('/login', null, { redirect: transition.path });
    }
    callback();
  }

  render () {
    return (
      <Router.RouteHandler/>
    );
  }
}

function mapStateToProps(state) {
  return { auth: state.auth }
}

export default connect(mapStateToProps, null)(LoginRequired)

