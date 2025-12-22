import React from 'react'
import { connect } from 'react-redux'


import ShopList from '../components/shop/ShopList.jsx'
import ShopHeader from '../components/shop/ShopHeader.jsx'

class Shop extends React.Component {

  componentWillMount(){
      if(this.props.currentUser.locked){
        this.context.router.push('lockeduser')
      }
  }

  componentWillUnmount(){
  }


  componentWillReceiveProps(nextProps){
      if(nextProps.currentUser.locked){
        this.context.router.push('lockeduser')
      }
  }

  render() {
    return (
      <div>
        <ShopHeader />
        <ShopList />
      </div>
    )
  }
}


function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}

export default connect(mapStateToProps, null)(Shop)

