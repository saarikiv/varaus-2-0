import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {getTimeStrMsBeginnignOfDay} from '../../helpers/timeHelper.js'
import { putSlotInfo } from '../../actions/slots.js'
import * as bookingsActionCreators from '../../actions/bookings.js'

export default class ReservationItem extends React.Component {

  render() {
    const { item } = this.props;

    const dayNames = [
      'Maanantai',
      'Tiistai',
      'Keskiviikko',
      'Torstai',
      'Perjantai',
      'Lauantai',
      'Sunnuntai'
    ]

    return (
        <tr className="td-orange">
          <th>{dayNames[item.day-1]}</th>
          <td className="centered table-time">{getTimeStrMsBeginnignOfDay(item.start)} - {getTimeStrMsBeginnignOfDay(item.end)}</td>
        </tr>
    );
  }
}


