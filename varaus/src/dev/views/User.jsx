import React from 'react'
import { Link } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as userActionCreators from '../actions/user.js'
import * as lsActionCreators from '../actions/loadingScreen.js'

import Timetable from '../components/user/Timetable.jsx'
import SlotInfo from '../components/user/SlotInfo.jsx'
import TimetableHeader from '../components/user/TimetableHeader.jsx'



class User extends React.Component {

  constructor(){
    super();
    this.userFullyLoaded = false
  }

  currentUserReady(currentUser){
    if( currentUser.bookingsReady && currentUser.transactionsReady) {
      this.userFullyLoaded = true;
      if(currentUser.locked){
        this.context.router.push('lockeduser')
      }
    }
  }

  componentWillMount() {
    this.currentUserReady(this.props.currentUser)
  }

  componentWillReceiveProps(nextProps){
    this.currentUserReady(nextProps.currentUser)
  }

  render() {    
    if( this.userFullyLoaded ) {
        return (
            <div>
              <TimetableHeader />
              <Timetable/>              
              <SlotInfo />              
            </div>
          );
      } else {
        return (
          <div class="container">
            <div className="centered">
              <Link className="text-link back-btn" to="/">&lt;Takaisin</Link>
            </div>
          </div>
        )
      }
  }
}

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(userActionCreators, dispatch),
    lsActions: bindActionCreators(lsActionCreators, dispatch) }
}

export default connect(mapStateToProps, mapDispatchToProps)(User)

