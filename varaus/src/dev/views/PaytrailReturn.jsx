import React from "react";
import { Link } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import  { getCurrentBaseUrl } from '../helpers/urlParser.js'
import * as actionCreators from '../actions/shop.js'

class PaytrailReturn extends React.Component {

  constructor(){
    super()
    this.finishingPayTrailOngoing = false;
  }

  componentWillReceiveProps(nextProps){
  }

  componentWillUnmount(){
    this.props.actions.resetShop()
  }

  renderStart(){
    if(this.props.location.search === ""){ //This should not really happen. Something has failed, and let's get user back to the user view.
      return(<Link className="text-link back-btn" to="user">&lt;Takaisin</Link>)
    }
    //We assume redirection from the PayTrail with details in the query object
    if(this.props.auth.uid){ //Wait for re-authentication as this is a redirect from the PayTrail.
      if(!this.finishingPayTrailOngoing){
        this.finishingPayTrailOngoing = true;
        setTimeout(() => {
          this.props.actions.finishPayTrailTransaction(this.props.location.query);
        }, 500)
      }
    }
    return(<div><h2 className="centered">Maksutiedot saatiin.</h2></div>)
  }

  renderPayTrailComplete(){
    let replacementUrl = getCurrentBaseUrl(document.location.href) + "/#/user"
    document.defaultView.location.replace(replacementUrl)
    //setTimeout(() => {this.context.router.push('user')}, 200)
    return(<div></div>)
  }

  render() {

    switch(this.props.shopItems.phase){
      case "payTrailComplete":
        return this.renderPayTrailComplete()
      case "start":
        return this.renderStart()
      default:
      return (<p>ERROR - PaytrailReturn view</p>)
    }
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

function mapStateToProps(state) {
  return { auth: state.auth, shopItems: state.shopItems, currentUser: state.currentUser }
}

export default connect(mapStateToProps, mapDispatchToProps)(PaytrailReturn)

