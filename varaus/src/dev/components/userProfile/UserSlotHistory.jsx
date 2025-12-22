import React from 'react'
import { connect } from 'react-redux'
import { getDayStrMs, getTimeStrMs } from '../../helpers/timeHelper.js'

class UserSlotHistory extends React.Component {
  componentWillReceiveProps(nextProps){
  }

  renderEntry(item){
    return(
      <li key={item.slotTime} className="booking-container">
        <p>{item.slotName} {getDayStrMs(item.slotTime)} {getTimeStrMs(item.slotTime)}</p>
      </li>
    )
  }

  render() {
      return (
        <div className="container bordered-container">
          <div className="content-container align-left">
            <h2 className="header-collapse">Varaushistoriasi</h2>
              <ul className="wide-list">
                {this.props.currentUser.history.map(this.renderEntry)}
              </ul>
          </div>
        </div>
      )
    }
}


function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}

export default connect(mapStateToProps, null)(UserSlotHistory)

