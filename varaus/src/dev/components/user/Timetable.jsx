import React from 'react'
import { Link } from 'react-router-dom'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { mapDay } from '../../helpers/timeHelper.js'
import TimetableItem from './TimetableItem.jsx'
import * as actionCreators from '../../actions/slots.js'

class Timetable extends React.Component {

  componentWillMount() {
    this.props.actions.fetchTimetable();
  }

  componentWillUnmount(){
    this.props.actions.stopFetchTimetable();
  }

  renderTR(dayname, dayNumber){
    const { bookings, slots } = this.props.timetable;
    let day = new Date()
    let today = (dayNumber === mapDay(day.getDay()))? true: false;
    if(today){
    return(
      <tr key={dayNumber}>
        <th>{dayname}</th>
        {
          slots.map(function(item) {
            if (item.day === dayNumber) {
              return (
                <TimetableItem key={item.key} item={item} booking={bookings[item.key]}/>
              )
            }
          })
        }
      </tr>
    )
    }
    return(
      <tr key={dayNumber}>
        <th>{dayname}</th>
        {
          slots.map(function(item) {
            if (item.day === dayNumber) {
              return (
                <TimetableItem key={item.key} item={item} booking={bookings[item.key]}/>
              )
            }
          })
        }
      </tr>
    )
  }

  renderWeek() {
    const now = new Date()
    const start = mapDay(now.getDay())
    let day = start
    let output = []
    const dayNames = [
      'Maanantai',
      'Tiistai',
      'Keskiviikko',
      'Torstai',
      'Perjantai',
      'Lauantai',
      'Sunnuntai'
    ]
    do {
      output.push(this.renderTR(dayNames[day - 1], day))
      day++
      if (day > 7) {
        day = 1
      }
    } while (day != start);
    return output
  }

  render() {
    return (
      <div class="container timetable-container">
      <h3 className="centered">Varauskalenteri:</h3>
        <table className="centered">
          <tbody>
            {this.renderWeek()}
          </tbody>
        </table>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { timetable: state.timetable}
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(Timetable)

