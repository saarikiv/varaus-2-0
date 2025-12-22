import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Item from './PendingTransactionItem.jsx'
import * as actionCreators from '../../actions/shop.js'

class PendingTransactionsList extends React.Component {

  constructor(){
    super()
    this.expanded = false;
  }

  componentWillMount() {
    this.props.actions.fetchPendingTransactions()
  }

  componentWillUnmount(){
    this.props.actions.stopFetchPendingTransactions()
  }

  componentWillReceiveProps(nextProps){
  }

  renderList(item) {
    return (
      <Item key={item.key} item={item}/>
    )
  }

  renderContent() {
    if (this.expanded) {
      return (
        <ul className="wide-list">
          {this.props.pendingTransactions.list.map(this.renderList)}
        </ul>
      )
    }
    else {
      return <div></div>
    }
  }
  minimizeInstructorList(){
    this.expanded = false;
    this.forceUpdate()
  }

  expandInstructorList(){
    this.expanded = true;
    this.forceUpdate()
  }

  renderExpandButton() {
    if(this.expanded) {
      return <button className="expand-btn" onClick={() => this.minimizeInstructorList()}>Piilota</button>
    }
    else {
      return <button className="expand-btn" onClick={() => this.expandInstructorList()}>Avaa</button>
    }
  }

  render() {
    return (
      <div className="container bordered-container">
        <div className="content-container align-left">
          <h2 className="header-collapse">Keskeneräiset maksutapahtumat</h2>
          {this.renderExpandButton()}
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { pendingTransactions: state.pendingTransactions }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(PendingTransactionsList)

