import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/shop.js'

import { getTimeStrMs, getDayStrMs} from '../../helpers/timeHelper.js'

class PendingTransactionItem extends React.Component {

  constructor() {
    super();
    this.confirmed1 = false;
    this.confirmed2 = false;
  }

  completeTransaction(item){
    if(this.confirmed1){
      this.props.actions.completePendingPayment(item.key)
      this.confirmed1 = false;
    } else {
      this.confirmed1 = true;
      this.forceUpdate()
      setTimeout(() => {
        this.confirmed1 = false;
        this.forceUpdate()        
      }, 2000)
    }
  }

  removeTransaction(item){
    if(this.confirmed2){
      this.props.actions.cancelPaytrailPayment(item.key)
      this.confirmed2 = false;
    } else {
      this.confirmed2 = true;
      this.forceUpdate()
      setTimeout(() => {
        this.confirmed2 = false;
        this.forceUpdate()        
      }, 2000)
    }
  }

  renderButtons() {

    var completeButtonName = (this.confirmed1)? "Vahvista hyväksyntä" : "Hyväksy transaktio"
    var removeButtonName = (this.confirmed2)? "Vahvista poisto" : "Poista transaktio"
    
    return(
      <div>
        <span className="item-row">
          <button className="btn-small btn-red" onClick={() => this.removeTransaction(this.props.item) }>{removeButtonName}</button> 
        </span>
        <span className="item-row">
          <button className="btn-small btn-green" onClick={() => this.completeTransaction(this.props.item) }>{completeButtonName}</button> 
        </span>
      </div>
    )
  }
  
  render() {
    const {item} = this.props

    return (
      <li className="text-list-item">
        <span className="item-row">ID: {item.key}   UID: {item.user}   Ostettu: {getDayStrMs(item.timestamp)} {getTimeStrMs(item.timestamp)} </span>
        <span className="item-row">Email: {item.receiptEmail}</span>
        <span className="item-row">Ostettu: {item.shopItem.title}  Hinta: {item.shopItem.price}€</span>
        {this.renderButtons()}
      </li>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(null, mapDispatchToProps)(PendingTransactionItem)

