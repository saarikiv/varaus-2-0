import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import SlotForm from '../../components/admin/SlotForm.jsx'
import Item from './SlotItem.jsx'
import * as actionCreators from '../../actions/admin.js'

class SlotList extends React.Component {

  constructor(){
    super()
    this.toggleForm = false
  }
  
  componentWillMount() {
    this.props.actions.fetchSlotList()
  }

  componentWillUnmount() {
    this.props.actions.stopFetchSlotList()
  }

  componentWillReceiveProps(nextProps){
      if(nextProps.cmp.expanded && nextProps.cmp.expander === "addNew"){
        this.toggleForm = true;
      } else {
        this.toggleForm = false;
      }
  }



  renderList(item) {
    return (
      <Item key={item.key} item={item}/>
    )
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

 renderForm(){
    if(this.toggleForm){
      return(<SlotForm mode="addNew"/>)
    } else {
      return(<div></div>)
    }
              
  }

  toggleAdd(){
  if(this.toggleForm){
      this.props.actions.minimizeSlotForm()
    } else {
      this.props.actions.expandSlotForm("addNew")
    }    
  }

  renderExpandButton() {
    var buttonText = (this.toggleForm)? "Peru lisäys" : "Lisää uusi"
    if(this.props.list.expanded) {
      return (
        <div>
        <button className="expand-btn" onClick={() => this.props.actions.minimizeSlotList()}>Piilota</button>
        <button className="expand-btn" onClick={() => this.toggleAdd()}>{buttonText}</button>
        </div>
      )
    }
    else {
      return <button className="expand-btn" onClick={() => this.props.actions.expandSlotList()}>Avaa</button>
    }
  }

  render() {
    return (
      <div className="container bordered-container">
        <div className="content-container align-left">
          <h2 className="header-collapse">Saunavuorot</h2>
          {this.renderExpandButton()}
          {this.renderForm()}
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { list: state.slotList, cmp: state.slotForm }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(SlotList)

