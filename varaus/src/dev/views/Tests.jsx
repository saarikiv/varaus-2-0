import React from 'react'
import { Link } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import  { getCurrentBaseUrl } from '../helpers/urlParser.js'

//var md5 = require('md5')

import * as testActionCreators from '../actions/test.js'
import * as userActionCreators from '../actions/user.js'
import * as bookingActionCreators from '../actions/bookings.js'

class Tests extends React.Component {

  constructor(){
    super();
    this.allowShow = false;
  }

  componentWillMount() {
   if(this.props.currentUser.roles.admin === true){
    this.allowShow = true;
  }
 }

  componentWillReceiveProps(nextProps){
    if(nextProps.currentUser.roles.admin === true){
    this.allowShow = true;
  }
}

  testFirebaseErrorLogging(){
    this.props.actions.testFirebaseErrorLogging();
  }

  test1(){
    let request = ""
    this.props.actions.test1('http://localhost:3000/paytrailnotification?ORDER_NUMBER=-KOAV7xtBHe6BtuYvbmX&TIMESTAMP=1470145564&PAID=AF2EA87226&METHOD=1&RETURN_AUTHCODE=A2747DCE5D552DCE6205A281755848A1');
  }
  test2(){
    let query = {
    METHOD: 1,
    ORDER_NUMBER: "-KOAuHQ5YVI9hu5S2hJl",
    PAID: "EE6EE2E856",
    RETURN_AUTHCODE: "5503EAB1304C67E814162F5FA66382D0",
    TIMESTAMP: 1470152414
    }
    this.props.actions.test2();
  }

  sendFeedback(){
    let feedback = document.getElementById("feedback").value
    this.props.userActions.sendFeedback(feedback)
  }

  testLateReserve(){
    let bookForUser = 'OmdRIx7cU6c6DwJADkFXqnap9ao2';
    let weeksBack = 1;
    let slot = null
    firebase.database().ref('/slots/-KNcWXwm6zpYimw3ATZ1').once('value')
    .then( snapshot => {
      slot = snapshot.val();
      slot.key = '-KNcWXwm6zpYimw3ATZ1'
    this.props.bookingActions.postLateReservation(bookForUser, weeksBack, slot)

    })
  }

  render() {
    if(this.allowShow){
      return(
        <div>
          <button className="btn-small btn-red" onClick={this.testLateReserve.bind(this)}>LateReserve</button>
          <br/>
          <button className="btn-small btn-red" onClick={this.test1.bind(this)}>Test-1</button>
          <button className="btn-small btn-red" onClick={this.test2.bind(this)}>Test-2</button>
          <button className="btn-small btn-red" onClick={this.testFirebaseErrorLogging.bind(this)}>testFirebaseErrorLogging-2</button>
          <br/>
          <button className="btn-small btn-green" onClick={this.sendFeedback.bind(this)}>SendFeedback</button>
          <textarea type="text" id="feedback"/>
          <p>{getCurrentBaseUrl(document.location.href)}</p>
        </div>
      )
    }
      return(
        <div>
          <p>Sinun pitää olla järjestelmän pääkäyttäjä.</p>
          <p>Ota yhteys järjestelmän valvojaan lisäoikeuksien saamiseksi.</p>
       </div>
      )
    
  }
}

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(testActionCreators, dispatch),
        userActions: bindActionCreators(userActionCreators, dispatch),
      bookingActions: bindActionCreators(bookingActionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(Tests)

