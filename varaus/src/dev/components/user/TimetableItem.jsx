import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {getTimeStrMsBeginnignOfDay} from '../../helpers/timeHelper.js'
import { putSlotInfo } from '../../actions/slots.js'
import * as bookingsActionCreators from '../../actions/bookings.js'

class TimeTableItem extends React.Component {

  componentWillReceiveProps(nextProps){
    if(this.props.slotInfo.key !== "0"){ //Pop-up is active and CI-props need to be updated
      //But only if bookings information has changed.
      if(this.props.booking !== nextProps.booking){
        this.props.slotActions.putSlotInfo(nextProps.item, nextProps.booking)
      }
    }
  }

  componentWillMount(){
    this.props.bookingsActions.fetchSlotBookings(this.props.item, this.props.currentUser.uid)
  }

  componentWillUnmount(){
    this.props.bookingsActions.stopfetchSlotBookings(this.props.item.key)
  }

  itemClicked() {
    this.props.slotActions.putSlotInfo(this.props.item, this.props.booking)
  }

  render() {
    const { booking, item } = this.props;
    let booked = <span>
                    <p className="table-participants">VAPAA</p>
                 </span>
    let tdClass = "td-green"

    if(item.blocked){
        booked = <span>
                    <p className="table-participants">VAKIOV. {item.reserver}</p>
                </span>
        tdClass = "td-blue"
    }

    if(booking){
      if(booking.all.length > 0){
        if(booking.all[0].reservations === 1) {
            booked = <p className="table-participants">KERTAVARAUS</p>
            tdClass = "td-orange"
        } else {
          booked = <span>
                        <p className="table-participants">VAPAA</p>
                   </span>
        }
      }
      if(booking.user.length > 0){
            tdClass += " bg-yellow"
      }
    }

    return (
      <td className={tdClass} onClick={() => this.itemClicked()}>
        <p className="table-time">{getTimeStrMsBeginnignOfDay(item.start)} - {getTimeStrMsBeginnignOfDay(item.end)}</p>
        {booked}
      </td>
    );
  }
}

function mapStateToProps(state) {
  return {  slotInfo: state.slotInfo, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { slotActions: bindActionCreators({putSlotInfo}, dispatch),
           bookingsActions: bindActionCreators(bookingsActionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(TimeTableItem)

