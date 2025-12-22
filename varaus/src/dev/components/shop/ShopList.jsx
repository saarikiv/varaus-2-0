import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import ShopItem from './ShopItem.jsx'
import * as shopActionCreators from '../../actions/shop.js'

class ShopList extends React.Component {

  componentWillMount() {
    const { oneTime } = this.props.currentUser.transactions.details;
    this.props.shopActions.fetchShopItems(oneTime)
  }

  componentWillReceiveProps(nextProps){
    const { oneTime } = this.props.currentUser.transactions.details;
    if (this.props.shopItems.items.length === 0) {
      if(oneTime){
        this.props.shopActions.fetchShopItems(oneTime)
      }
    }       
  }

  renderShopItems(item) {
    return (
      <ShopItem key={item.key} item={item} roles={this.props.currentUser.roles}/>
    )
  }

  render() {
    if(this.props.shopItems.items.length > 0){
      return (
        <div className="container">
          <div className="content-container align-left">
            <ul className="shop-list">
              {this.props.shopItems.items.map(this.renderShopItems.bind(this))}
            </ul>
          </div>
        </div>
      )
    } else {
        return(<div></div>)
    }
  }
}

function mapStateToProps(state) {
  return {
    shopItems: state.shopItems,
    currentUser: state.currentUser,
    auth: state.auth
  }
}

function mapDispatchToProps(dispatch) {
  return {
    shopActions: bindActionCreators(shopActionCreators, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ShopList)

