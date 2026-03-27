import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as userActionCreators from '../../actions/user.js'

class DeleteProfileButton extends React.Component {

  constructor() {
    super()
    this.state = {
      showConfirmation: false
    }
  }

  handleDeleteClick() {
    this.setState({ showConfirmation: true })
  }

  handleCancel() {
    this.setState({ showConfirmation: false })
  }

  handleConfirm() {
    this.setState({ showConfirmation: false })
    this.props.userActions.deleteProfile()
  }

  renderWarning() {
    if (this.props.currentUser.hasActiveBookings) {
      return (
        <p style={{ color: '#c0392b', fontWeight: 'bold', margin: '10px 0' }}>
          Sinulla on aktiivisia varauksia. Peru varaukset ennen profiilin poistoa.
        </p>
      )
    }
    return null
  }

  renderConfirmationDialog() {
    if (!this.state.showConfirmation) return null
    return (
      <div className="slot-info-container">
        <div className="outer">
          <div className="middle">
            <div className="inner" style={{ textAlign: 'center', maxWidth: '400px' }}>
              <h3>Profiilin poisto</h3>
              <p>Haluatko varmasti poistaa profiilisi? Tätä toimintoa ei voi peruuttaa.</p>
              <div style={{ marginTop: '15px' }}>
                <a
                  className="btn-small btn-red"
                  onClick={this.handleConfirm.bind(this)}
                  style={{ marginRight: '10px', cursor: 'pointer' }}
                >
                  Vahvista poisto
                </a>
                <a
                  className="btn-small btn-blue"
                  onClick={this.handleCancel.bind(this)}
                  style={{ cursor: 'pointer' }}
                >
                  Peruuta
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { deletionInProgress } = this.props.currentUser
    return (
      <div className="container bordered-container">
        <div className="content-container">
          <h2 className="header-collapse">Poista profiili</h2>
          {this.renderWarning()}
          <a
            className="btn-small btn-red"
            onClick={!deletionInProgress ? this.handleDeleteClick.bind(this) : undefined}
            style={{
              cursor: deletionInProgress ? 'not-allowed' : 'pointer',
              opacity: deletionInProgress ? 0.5 : 1
            }}
          >
            {deletionInProgress ? 'Poistetaan...' : 'Poista profiili'}
          </a>
          {this.renderConfirmationDialog()}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return {
    userActions: bindActionCreators(userActionCreators, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DeleteProfileButton)
