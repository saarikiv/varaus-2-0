import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/auth.js'

class UserAuth extends React.Component {

  changeEmailPassword() {
    let emailCur = document.getElementById("UAemailCur").value
    let passwdCur = document.getElementById("UApasswordCur").value
    let emailNew = document.getElementById("UAemailNew").value
    let passwdNew = document.getElementById("UApasswordNew").value
    
    if(emailNew !== this.props.auth.email){
      this.props.actions.updateEmailAddress(emailCur, passwdCur, emailNew)
    }
   if(passwdNew !== ""){
      this.props.actions.updatePassword(emailCur, passwdCur, passwdNew)
   }
  }

  renderContent() {
    if(!this.props.auth) return( <div></div>)
    let emailLab = <label>Sähköposti</label>;
    if(this.props.auth.emailUpdated === true){
      emailLab = <label>Sähköposti päivitetty</label>;
    }
    let passwordLab = <label>Salasana</label>;
    if(this.props.auth.passwordUpdated === true){
      emailLab = <label>Salasana päivitetty</label>;
    }
      return (
            <form>              
              {emailLab}
              <input id="UAemailCur" type="email" defaultValue={this.props.auth.email}/>
              <input id="UAemailNew" type="email" placeholder="Uusi sähköposti"/>
              {passwordLab}
              <input id="UApasswordCur" type="password" />
              <input id="UApasswordNew" type="password" placeholder="Uusi salasana"/>
              <br/>
              <button className="btn-small btn-blue" onClick={this.changeEmailPassword.bind(this)}>Päivitä</button>
              <br/>
              <b>{this.errorText}</b>
            </form>
      )
  }

  render() {
    return (
      <div className="container bordered-container">
        <div className="content-container">
          <h2 className="header-collapse">Tunnistetietosi</h2>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { auth: state.auth }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(UserAuth)

