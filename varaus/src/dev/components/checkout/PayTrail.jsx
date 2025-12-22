import React from "react";
import  { getCurrentBaseUrl } from '../../helpers/urlParser.js'

export default class PayTrail extends React.Component {

  constructor() {
    super()
    this.widgetInitialized = false;
    this.onceOnly = false;
  }

    cancelPayment(initializedTransaction){
    if(!this.onceOnly){
      this.onceOnly = true;
      this.props.actions.cancelPaytrailPayment(this.props.shopItems.initializedTransaction)
    }
  }


  render() {
    const { cart, initializedTransaction, authCode } = this.props.shopItems
    let merchantId = "13466"
    let amount = cart.price;
    let orderNumber = initializedTransaction
    let referenceNumber = ""
    let orderDescription = cart.key;
    let currency = "EUR"
    let returnAddress = getCurrentBaseUrl(document.location.href) + "/#/paytrailreturn"
    let cancelAddress = getCurrentBaseUrl(document.location.href) + "/#/paytrailcancel"
    let pendingAddress = ""
    let notifyAddress = VARAUSSERVER + "/paytrailnotification"
    let type = "S1"
    let culture = "fi_FI"
    let preselectedMethod = ""
    let mode = "1"
    let visibleMethods = ""
    let group = ""
    let _authcode = merchantId + '|' + amount + '|' + orderNumber + '|' + referenceNumber + '|' + orderDescription + '|' + currency + '|' + returnAddress + '|' + cancelAddress + '|' + pendingAddress + '|' + notifyAddress + '|' + type + '|' + culture + '|' + preselectedMethod + '|' + mode + '|' + visibleMethods + '|' + group;    
    
    if(authCode === ""){
      setTimeout(() => {
        this.props.actions.getAuthCode(_authcode)
      }, 500)      
      return(<div></div>)
    }

    if(!this.widgetInitialized){
      this.widgetInitialized = true;
      setTimeout(() => {
        SV.widget.initWithForm('payment', {charset:'UTF-8'});
      }, 1000)
    }

    return(
      <div className="container">
        <div className="content-container paytrail-container centered">
          <div className="mobile-full">
            <button className="btn-small btn-red margin-bottom" onClick={() => this.cancelPayment(initializedTransaction)}>Peru osto</button>
          </div>
          <form id="payment">
            <input name="MERCHANT_ID" type="hidden" value={merchantId}/>
            <input name="AMOUNT" type="hidden" value={amount}/>
            <input name="ORDER_NUMBER" type="hidden" value={orderNumber}/>
            <input name="REFERENCE_NUMBER" type="hidden" value={referenceNumber}/>
            <input name="ORDER_DESCRIPTION" type="hidden" value={orderDescription}/>
            <input name="CURRENCY" type="hidden" value={currency}/>
            <input name="RETURN_ADDRESS" type="hidden" value={returnAddress}/>
            <input name="CANCEL_ADDRESS" type="hidden" value={cancelAddress}/>
            <input name="PENDING_ADDRESS" type="hidden" value={pendingAddress}/>
            <input name="NOTIFY_ADDRESS" type="hidden" value={notifyAddress}/>
            <input name="TYPE" type="hidden" value={type}/>
            <input name="CULTURE" type="hidden" value={culture}/>
            <input name="PRESELECTED_METHOD" type="hidden" value={preselectedMethod}/>
            <input name="MODE" type="hidden" value={mode}/>
            <input name="VISIBLE_METHODS" type="hidden" value={visibleMethods}/>
            <input name="GROUP" type="hidden" value={group}/>
            <input name="AUTHCODE" type="hidden" value={authCode}/>
          </form>
        </div>      
      </div>
    )
  }
}

