import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/admin.js'
import FormCount from './ShopItemCountForm.jsx'

class ShopItem extends React.Component {

  constructor(){
    super();
    this.toggleCountForm = false
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.cmpCount.expanded && nextProps.cmpCount.expander === this.props.item.key){
      this.toggleCountForm = true
    } else {
      this.toggleCountForm = false
    }
  }

  toggleCountModify(item){
    if(this.toggleCountForm){
      this.props.actions.minimizeCountShopForm()
    } else {
      this.props.actions.expandCountShopForm(item.key)
    }    
  }


  renderModifyButtons(item) {
    var buttonCountText = (this.toggleCountForm)? "Peru Muokkaus" : "Muokkaa"

    return <button className="btn-small btn-blue" onClick={() => {this.toggleCountModify(item)}}>{buttonCountText}</button>
  }
  
  renderLockButtons(item) {
    //TODO: fix according !user.locked
    //TODO: add button functionality
    if (item.locked) {
      return <button className="btn-small btn-green" onClick={() => this.props.actions.unlockShopItem(item.key)}>Ota käyttöön</button>      
    }
    else {
      return <button className="btn-small btn-red" onClick={() => this.props.actions.lockShopItem(item.key)}>Poista käytöstä</button>
    }
  }

  renderCountForm(item){
    if(this.toggleCountForm){
      return <FormCount mode="modify" dbKey={item.key} initialValues={item}/>
    } else {
      return(<div></div>)
    }
  }

 
  renderType(item) {
    if (item.type === "count") {
      return <span className="item-row">Kertakortti</span>
    } else {
      return <span className="item-row">EI TYYPPIÄ</span>
    }
  }
  
  render() {
    //TODO: Render functionality for admin
    const {item} = this.props

    return (
      <li className="text-list-item">
        <span className="item-row">{item.title}</span>
        {this.renderType(item)}
        <span className="item-row">
          {this.renderModifyButtons(item)}
        </span>
        <span className="item-row">
          {this.renderLockButtons(item)}
        </span>
        {this.renderCountForm(item)}
      </li>
    )
  }
}

function mapStateToProps(state) {
  return { cmpCount: state.shopItemCountForm}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(ShopItem)

