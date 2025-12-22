import React from 'react'
import {getDayStrMs, getTimeStrMs} from '../../helpers/timeHelper.js'

class UserTransaction extends React.Component {

  render() {
    var unused = "";
    if(this.props.item.type === "count"){
      unused = "Käyttämättä: " + this.props.item.unusedtimes + "/" + this.props.item.usetimes + " -- "
    }

    var notSpecial = null
    if(this.props.item.type !== "special"){
      notSpecial = <p>{unused}Voimassa: {getDayStrMs(this.props.item.expires)} </p>
    }

    return (
        <li className="transaction-container">
          <p>Ostettu: {this.props.item.shopItem.title} -- {getDayStrMs(this.props.item.purchasetime)} </p>
          {notSpecial}
          <p>Ostotapa: {this.props.item.paymentInstrumentType}</p>
        </li>
    )
  }
}

export default UserTransaction;

