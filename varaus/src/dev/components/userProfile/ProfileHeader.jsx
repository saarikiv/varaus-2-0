import React from "react"
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import * as authActionCreators from '../../actions/auth.js'
import * as userActionCreators from '../../actions/user.js'

class ProfileHeader extends React.Component {

  constructor(){
    super();
    this.emailVerificationOngoing = false
  }

  handleEmailVerify(){
    if(!this.emailVerificationOngoing){
      this.emailVerificationOngoing = true;
      this.props.userActions.sendEmailVerification()
    } 
  }

  render() {
    const { auth } = this.props

    var emailVerification = null
    if(auth.uid){
      if(!auth.userdata.emailVerified){
        emailVerification = <a className="btn-small btn-red text-bold" onClick={this.handleEmailVerify.bind(this)}>Varmista sähköpostisi</a>  
      }
    }

    return (
      <div class="container header-container">          
        <div className="content-container">
          <h1 className="padded-header">Käyttäjän hallinnointi</h1>
          <div className="block margin-top">
            <div className="block margin-bottom margin-top">
              {emailVerification}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return {
    userActions: bindActionCreators(userActionCreators, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProfileHeader)

