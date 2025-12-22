import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from "react-router-dom"

import { getSlotTimeLocal, sameDay, hasDayPassed, hasTimePassed, timeToMoment, getDayStrMs, getTimeStrMs, getDayStr, getTimeStr } from '../../helpers/timeHelper.js'
import {removeSlotInfo} from '../../actions/slots.js'
import * as bookingsActionCreators from '../../actions/bookings.js'
import UserList from '../admin/UserList.jsx'

class SlotInfo extends React.Component {

  constructor(){
    super();
    this.fetchStarted = false;
    this.reservationRequestOngoing = false;
    this.confirmation = false;
    this.timeoutId = 0;
  }

  componentWillReceiveProps(nextProps){
    this.cancellationOngoing = false;
    if(nextProps.slotInfo.closeInfo){
      this.exitContainer()
    }
  }

  componentWillUnmount(){
    if(this.timeoutId !== 0){
      clearTimeout(this.timeoutId);
    }
  }

  cancelReservation(forward){
    const { slotInfo } = this.props;
    if(this.confirmation){
      if(!this.cancellationOngoing){
        this.cancellationOngoing = true;
        this.props.bookingsActions.postCancellation(
          slotInfo.bookings.user[0].item, 
          slotInfo.bookings.user[0].txRef, 
          slotInfo);
          this.exitContainer();
      }
    } else {
      this.confirmation = true;
      this.forceUpdate();
      this.timeoutId = setTimeout( () => {
        this.confirmation = false;
        this.forceUpdate();
      }, 2000)
    }
    

  }

  makeReservation(forward) {
    if(!this.reservationRequestOngoing){
      this.reservationRequestOngoing = true;
      this.props.bookingsActions.postReservation(forward, this.props.slotInfo)
      this.exitContainer()
    }
  }

  exitContainer() {
    this.props.slotActions.removeSlotInfo()
    this.reservationRequestOngoing = false;
    this.cancellationOngoing = false;
    this.confirmation = false;
  }

  userCanBook(day){
    const { transactions } = this.props.currentUser;
    return (transactions.count > 0) ? true : false;
  }


  //========================================================================
  //========================================================================
  //========================================================================
  renderReservationButton(slotInfo, day, dayStr, weekIndex){

    var notificationText = null;

    if(slotInfo.bookings){
      if(slotInfo.bookings.user.length > 0){
        if((Date.now() + (3 * 60 * 60 * 1000)) > day.getTime() ){
          return(
            <p className="text-red"> Vuoron alkuun alle 3 tuntia. Vuoroa ei voi enää perua.</p>
          );
        }
          let cancelButton = (this.confirmation)? "Vahvista peruutus" : "Peru"
          return( <div>
                    <p className="text-blue"> Sinä olet varannut tämän vuoron.</p>
                    <button className="btn-small btn-red mobile-full" onClick={() => this.cancelReservation(weekIndex)} > {cancelButton} </button>
                  </div>
                );
      }
      if(slotInfo.bookings.all.length > 0){
        return(
          <p className="text-red"> Vuoro on varattu!</p>
        );
      }
    }

      if(slotInfo.blocked){
        return(
          <p className="text-red"> Vuoro on vakiovuoro!</p>
        );
      }

    if(!this.userCanBook(day)){
      return(<div>
              <p className="info-cantreserve">Sinulla ei ole varausoikeutta. Mene sovelluksen KAUPPA-osioon ja osta itsellesi varauskertoja.</p>
            </div>
      );
    }
    
    return(
          <div>
            {notificationText}
            <button className="btn-small btn-blue mobile-full" onClick={() => this.makeReservation(weekIndex)} >
              Varaa: { dayStr }
            </button>
          </div>
        );
  }



  render() {
    const { slotInfo } = this.props;

    let weekIndex = 0;
    if (hasTimePassed(slotInfo.day, slotInfo.end)) {
      weekIndex = 1;
    }

    let day = getSlotTimeLocal(weekIndex, slotInfo.start, slotInfo.day);
    let dayStr = getDayStr(day) + " " + getTimeStr(day);
    let end = getSlotTimeLocal(weekIndex, slotInfo.end, slotInfo.day);
    let endStr = getTimeStr(end);

    if(this.props.slotInfo.key !== "0"){
      return (
        <div className="slot-info-container">
          <div className="slot-info">
            <img src="./assets/error.png" className="exit-btn" onClick={this.exitContainer.bind(this)} />
            <div className="info-info-container">
            <h3>Vuoron tiedot</h3>
              <div className="surrounded-border">
                <p className="info-line border-bottom">Aika: {dayStr} - {endStr}</p>
              </div>
              <div>
                {this.renderReservationButton(slotInfo, day, dayStr, weekIndex)}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return ( <div></div>)
    }
  }
}

function mapStateToProps(state) {
  return {  slotInfo: state.slotInfo, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { slotActions: bindActionCreators({removeSlotInfo}, dispatch),
           bookingsActions: bindActionCreators(bookingsActionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(SlotInfo)

