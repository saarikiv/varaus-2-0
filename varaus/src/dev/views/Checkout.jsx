import React from "react";
import { Link } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../actions/shop.js'
import SubmitDelayed from "../components/checkout/SubmitDelayed.jsx"
import CashPayment from "../components/checkout/CashPayment.jsx"

class Checkout extends React.Component {

  constructor(){
    super()
    this.paymentOngoing = false;
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.shopItems.phase === "timeout"){
      this.context.router.push('user');
    }
  }

  componentWillUnmount(){
    this.props.actions.resetShop(this.props.shopItems)
  }

  renderDelayedTransaction(){
    return(
      <SubmitDelayed actions={this.props.actions} shopItems={this.props.shopItems} />
    )    
  }

  renderDelayed(){
    console.log("renderDelayed")
    setTimeout(() => {this.context.router.push('user')}, 200)
    return(<div></div>)
  }

  renderStart(){
      return(
          <div className="centered">
            <Link className="text-link back-btn margin-top" to="user">&lt;Takaisin</Link>
          </div>
        )
  }

  onReady() {
      document.getElementById("submitButton").disabled = false;
  }

  onError(err) {
        //Drop-in error. Transient. No action.
        console.error(err);
  }

  onPaymentMethodReceived(payload) {
    if(!this.paymentOngoing){
      this.paymentOngoing = true;
      this.props.actions.doPurchaseTransaction(payload.nonce, this.props.shopItems.cart.key, this.props.shopItems.cart.type)
    }
  }

//=================================================================
//Render logic
//=================================================================

renderCashPayment(){
    return( 
      <CashPayment actions={this.props.actions} />
    )
}

  renderDonePhase(){
    this.props.actions.waitForMilliseconds(300);
    return(
      <div>
      </div>
    )
  }

  renderError(){
    return(
      <div>
        <h2 className="centered">Maksuyhteydessä ongelmia...</h2>
      </div>
    )
  }

  render() {

    switch(this.props.shopItems.phase){
      case "delayedTransactionInitialized":
        return this.renderDelayedTransaction()
      case "delayedPayment":
        return this.renderDelayed()
      case "cashPayment":
        return this.renderCashPayment()
      case "done":
        return this.renderDonePhase()
      case "error":
        return this.renderError()
      case "timeout":
        return(<p> Palataan takaisin päänäkymään.</p>)
      case "start":
        return this.renderStart()
      default:
      return (<p>ERROR</p>)
    }
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

function mapStateToProps(state) {
  return { auth: state.auth, shopItems: state.shopItems, currentUser: state.currentUser }
}

export default connect(mapStateToProps, mapDispatchToProps)(Checkout)

