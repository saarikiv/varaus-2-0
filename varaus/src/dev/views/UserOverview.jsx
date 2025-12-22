import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import UserList from '../components/userOverview/UserList.jsx'
import * as actionCreators from '../actions/userOverview.js'

class UserOverview extends React.Component {

 constructor(){
   super()
   this.allowShow = false;
 }

componentWillMount(){
  this.props.actions.fetchUsersToOverview()
}

componentWillUnmount(){
}

componentWillReceiveProps(nextProps){
  if(nextProps.currentUser.roles.admin === true){
    this.allowShow = true;
  }
  if(nextProps.userOverview.refreshRequired){
    this.props.actions.fetchUsersToOverview()
  }
}

  render() {
    if(this.props.currentUser.key === "0"){
      return <div/>
    }
    if(this.allowShow){
      return (
        <div>
          <UserList />
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
  return { userOverview: state.userOverview, auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(UserOverview)

