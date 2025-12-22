import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/shop.js'
import { daysLeft, getDayStrMs } from '../../helpers/timeHelper.js'

class ValidItem extends React.Component {

  constructor(){
    super()
    this.confirmation = false
    this.okConfirmation = false
    this.okTimeoutId = 0
    this.timeoutId = 0
  }

  componentWillUnmount() {
    if(this.timeoutId !== 0) {
      clearTimeout(this.timeoutId)
    }
    if(this.okTimeoutId !== 0) {
      clearTimeout(this.okTimeoutId)
    }
  }

  okTransaction(item, user){
    if(this.okConfirmation) {
      this.props.actions.okTransaction (item, user)
      this.okConfirmation = false
    } else {
      this.okConfirmation = true
      this.forceUpdate()
      this.okTimeoutId = setTimeout(() => {
        this.okConfirmation = false;
        this.forceUpdate()
      }, 2000)
    }
  }

  remove(item, user) {
    if(this.confirmation) {
      this.props.actions.removeTransaction (item, user)
      this.confirmation = false
    } else {
      this.confirmation = true
      this.forceUpdate()
      this.timeoutId = setTimeout(() => {
        this.confirmation = false;
        this.forceUpdate()
      }, 2000)
    }
  }

  render() {
    let removeButtonText = (this.confirmation)? "Vahvista poisto" : "Poista"
    let okButtonText = (this.okConfirmation)? "Vahvista kuittaus" : "Kuittaa maksu"
    let okButton = <button className="btn-small btn-green" onClick={() => {this.okTransaction(item, user)}}>{okButtonText}</button>
    const { item, user } = this.props
    console.log("ITEM:", item);
    if (item.paymentReceived){
      okButton = <h3>Maksu OK</h3>
    }
    return (
      <li>
        <span className="item-row">kortti: {item.shopItem.title}</span>
        <span className="item-row">ostettu: {getDayStrMs(item.purchasetime)} ostotapa: {item.paymentInstrumentType}</span>
        <button className="btn-small btn-red" onClick={() => {this.remove(item, user)}}>{removeButtonText}</button>
        {okButton}
      </li>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(null, mapDispatchToProps)(ValidItem)
