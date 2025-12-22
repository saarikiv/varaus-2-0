import React from 'react'
import { Link } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import Item from './InfoItem.jsx'
import { fetchInfoList } from '../../actions/info.js'

class InfoList extends React.Component {

  componentWillMount() {
    this.props.fetchInfoList()
  }
  
  renderList(item) {
    return (
      <Item key={item.key} item={item}/>
    )
  }
  
  render() {
    if (this.props.list.list.length > 0) {
      return (
        <div class="container">
          <div className="centered">
            <Link className="text-link back-btn" to="/">&lt;Takaisin</Link>
          </div>
          <div className="content-container">
            <ul className="wide-list blank-list">
              {this.props.list.list.map(this.renderList)}
            </ul>
          </div>
        </div>
      );
    } else {
      return (
        <div></div>
      )
    }
  }
}

function mapStateToProps(state) {
  return { list: state.infoList }
}

export default connect(mapStateToProps, { fetchInfoList })(InfoList)
