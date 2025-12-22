import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Item from './ShopItem.jsx'
import * as actionCreators from '../../actions/admin.js'
import FormCount from './ShopItemCountForm.jsx'

class ShopList extends React.Component {

  constructor(){
    super();
    this.toggleCountForm = false
  }

  componentWillMount() {
    this.props.actions.fetchShopList()
  }
  componentWillUnmount() {
    this.props.actions.stopFetchShopList()
  }

  componentWillReceiveProps(nextProps){

    if(nextProps.cmpCount.expanded && nextProps.cmpCount.expander === "addNew"){
      this.toggleCountForm = true;
    } else {
      this.toggleCountForm = false;
    }
  }

  renderList(item) {
    return (
      <Item key={item.key} item={item} />
    )
  }

  renderCountForm(){
    if(this.toggleCountForm){
      return ( <FormCount mode="addNew"/>)
    } else {
      return <div></div>
    }
  }


  toggleAddCount(){
    if(this.toggleCountForm){
      this.props.actions.minimizeCountShopForm()
    } else {
      this.props.actions.expandCountShopForm("addNew")
    }
  }


  renderContent() {    
    if (this.props.list.expanded) {
      return (
        <ul className="wide-list">
          {this.props.list.list.map(this.renderList)}
        </ul>
      )
    }
    else {
      return <div></div>
    }
  }

  renderExpandButton() {

    var buttonTextCount = (this.toggleCountForm)? "Peru lisäys" : "Lisää uusi Kertakortti"
    
    if(this.props.list.expanded) {
      return (
        <div>
          <button className="expand-btn" onClick={() => this.props.actions.minimizeShopList()}>Piilota</button>
          <button className="expand-btn" onClick={() => this.toggleAddCount()}>{buttonTextCount}</button>
        </div>
      )
    }
    else {
      return <button className="expand-btn" onClick={() => this.props.actions.expandShopList()}>Avaa</button>
    }
  }

  render() {
    return (
      <div className="container bordered-container">
        <div className="content-container align-left">
          <h2 className="header-collapse">Kauppa</h2>
          {this.renderExpandButton()}
          {this.renderCountForm()}
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { list: state.shopList, cmpCount: state.shopItemCountForm}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(ShopList)

