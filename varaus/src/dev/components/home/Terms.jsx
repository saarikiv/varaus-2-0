import React from 'react'
import { connect } from 'react-redux'

import Item from './TermItem.jsx'
import { fetchTerms } from '../../actions/terms.js'

class Terms extends React.Component {

  componentWillMount() {
    this.props.fetchTerms()
  }

  renderTerms(item) {
    return (
      <Item key={item.key} item={item}/>
    )
  }

  render() {
    return (
      <ul class="wide-list">
          {this.props.terms.map(this.renderTerms.bind(this))}
      </ul>
    )
  }
}


function mapStateToProps(state) {
  return { terms: state.terms }
}

export default connect(mapStateToProps, { fetchTerms })(Terms)

