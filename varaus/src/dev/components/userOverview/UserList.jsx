import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Item from './UserItem.jsx'
import SearchBar from '../admin/SearchBar.jsx'

class UserList extends React.Component {

  constructor() {
    super()
  }

  componentWillMount() {
    this.setState({keyword: null})
  }

  renderList(item) {
    const { credits } = this.props.userOverview
    if (item.email.toUpperCase().indexOf(this.state.keyword) !== -1) {
      return (
        <Item key={item.uid} item={item} credits={credits[item.uid]}/>
      )
    }    
  }

  activateSearch() {
    this.setState({keyword: this.props.searchBar.value.toUpperCase()})
  }

  renderContent() {
    const { userList } = this.props.userOverview
    let searchButtonText = (this.props.searchBar.value === "") ? "Hae kaikki" : "Hae"
    return (
        <ul className="wide-list">
          <span className="item-row">
            <div className="halved-container">
              <SearchBar />
            </div>
            <button className="btn-small btn-blue search-btn" onClick={() => this.activateSearch()}>{searchButtonText}</button>
          </span>
          {userList.map(this.renderList.bind(this))}
        </ul>
    )
  }

  render() {
    return (
      <div className="container">
        <div className="content-container align-left">          
          <h2 className="header-collapse">Käyttäjät</h2>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { userOverview: state.userOverview, searchBar: state.searchBar}
}

export default connect(mapStateToProps, null)(UserList)

