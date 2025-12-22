import React from "react";
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import BarChart from './BarChart.js';
import DatePicker from 'react-datepicker'
import moment from 'moment'

import * as actionCreators from '../../actions/diagnostics.js'


class DiagnosticsViewer extends React.Component {

  constructor(){
    super()
    const start = moment();
    start.hours(0);
    start.minutes(0);
    start.seconds(0);
    start.milliseconds(0);
    this.startDate = start.toDate();

    const end = moment();
    end.hours(23);
    end.minutes(59);
    end.seconds(59);
    end.milliseconds(999);
    this.endDate = end.toDate();
    this.width = Math.round(document.defaultView.innerWidth/1.5);
  }


  onResize(){
    this.width = Math.round(document.defaultView.innerWidth/1.5);
    this.forceUpdate();
  }

  componentDidMount(){
    document.defaultView.onresize = this.onResize.bind(this)
  }

  onChangeStartDate(date){
    const start = moment(date);
    start.hours(0);
    start.minutes(0);
    start.seconds(0);
    start.milliseconds(0);
    this.startDate = start.toDate();
    
    if(this.endDate < this.startDate){
      this.onChangeEndDate(this.startDate)
    }
    this.forceUpdate();
  }

  onChangeEndDate(date){
    const end = moment(date);
    end.hours(23);
    end.minutes(59);
    end.seconds(59);
    end.milliseconds(999);
    this.endDate = end.toDate();
    
    if(this.endDate < this.startDate){
      this.onChangeStartDate(this.endDate)
    }
    this.forceUpdate();
  }

  fetchData(){
    this.props.actions.fetchDiagnostics(this.startDate.valueOf(), this.endDate.valueOf())
  }

  componentWillReceiveProps(nextProps){
    //console.log("DV-next:", nextProps);
  }

  showEventSessions(item){
    const { dataReady, data } = this.props.ddata;
    if(!dataReady){
      return(<div></div>)
    }
    if(this.endDate - this.startDate < 20*24*60*60*1000){
      return this.showHourlyEventSessions(item)
    }
    return this.showDailyEventSessions(item)
  }

  showSessions(){
    const { dataReady, data } = this.props.ddata;
    if(!dataReady){
      return(<div></div>)
    }
    if(this.endDate - this.startDate < 20*24*60*60*1000){
      return this.showHourlySessions()
    }
    return this.showDailySessions()
  }

  showHourlyEventSessions(eventData){
    let barWidth = Math.round(this.width/((this.endDate - this.startDate)/3600000));
    barWidth = (barWidth === 0)? 1 : barWidth;
    let xRange = [moment(this.startDate).format().slice(0,16), moment(this.endDate).format().slice(0,16)]
    let hourlyData = [].concat(eventData[Object.keys(eventData)[0]].sessions.hourlySessions)
    return(
      <div>
          <BarChart
          axisLabels={{x: Object.keys(eventData)[0], y: ''}}
          margin={{top: 10, right: 30, bottom: 60, left: 80}}
          axes
          grid
          height={100}
          width={this.width}
          datePattern="%Y-%m-%dT%H:%M"
          barWidth={barWidth}
          xType={'time'}
          xDomainRange={xRange}
          xTickNumber = {4}
          yTickNumber = {2}
          data={hourlyData}
          />
      </div>
    )
  }


  showHourlySessions(){
    const { dataReady, data } = this.props.ddata;
    if(!dataReady){
      return(<div></div>)
    }
    let barWidth = Math.round(this.width/((this.endDate - this.startDate)/3600000));
    barWidth = (barWidth === 0)? 1 : barWidth;
    let xRange = [moment(this.startDate).format().slice(0,16), moment(this.endDate).format().slice(0,16)]
    let hourlyData = [].concat(data.sessions.hourlySessions)
    return(
      <div>
          <BarChart
          axisLabels={{x: 'Aika', y: 'Käyttökerrat'}}
          margin={{top: 10, right: 30, bottom: 60, left: 80}}
          axes
          grid
          height={250}
          width={this.width}
          datePattern="%Y-%m-%dT%H:%M"
          barWidth={barWidth}
          xType={'time'}
          xDomainRange={xRange}
          xTickNumber = {4}
          yTickNumber = {6}
          data={hourlyData}
          />
      </div>
    )
  }


  showDailyEventSessions(eventData){
    let barWidth = Math.round(this.width/((this.endDate - this.startDate)/(24*3600000)));
    barWidth = (barWidth === 0)? 1 : barWidth;
    let xRange = [moment(this.startDate).format().slice(0,10), moment(this.endDate).format().slice(0,10)]
    let dailyData = [].concat(eventData[Object.keys(eventData)[0]].sessions.dailySessions)
    return(
      <div>
          <BarChart
          axisLabels={{x: Object.keys(eventData)[0], y: ''}}
          margin={{top: 10, right: 30, bottom: 60, left: 80}}
          axes
          grid
          height={100}
          width={this.width}
          datePattern="%Y-%m-%d"
          barWidth={barWidth}
          xType={'time'}
          xDomainRange={xRange}
          xTickNumber = {4}
          yTickNumber = {2}
          data={dailyData}
          />
      </div>
    )
  }

  showDailySessions(){
      const { dataReady, data } = this.props.ddata;
      if(!dataReady){
        return(<div></div>)
      }
      let barWidth = Math.round(this.width/((this.endDate - this.startDate)/(24*3600000)));
      barWidth = (barWidth === 0)? 1 : barWidth;
      let xRange = [moment(this.startDate).format().slice(0,10), moment(this.endDate).format().slice(0,10)]
      let dailyData = [].concat(data.sessions.dailySessions)
      return(
        <div>
            <BarChart
            axisLabels={{x: 'Aika', y: 'Käyttökerrat'}}
            axes
            grid
            height={250}
            width={this.width}
            datePattern="%Y-%m-%d"
            barWidth={barWidth}
            xType={'time'}
            xDomainRange={xRange}
            xTickNumber = {4}
            yTickNumber = {6}
            data={dailyData}
            />
        </div>
      )
    }

  renderGraphs(){
    const { dataReady, data} = this.props.ddata;
    if(!dataReady){
       return(<div></div>)
    }

    return(
      <div>
          {this.showSessions()}
          {data.eventSessions.map(this.showEventSessions.bind(this))}
      </div>
    )
  }

  render() {
    const { dataReady, data } = this.props.ddata;
    return (
      <div class="container">
        <div className="content-container">
          <div className="float-left">
            <p>Alku:</p>
            <DatePicker className="date-start"
              selected={this.startDate}
              startDate={this.startDate}
              endDate={this.endDate}
              onChange={this.onChangeStartDate.bind(this)} />
          </div>
          <div className="float-left">
            <p>Loppu:</p>
            <DatePicker className="date-end"
            selected={this.endDate}
            startDate={this.startDate}
            endDate={this.endDate}
            onChange={this.onChangeEndDate.bind(this)} />
          </div>
          <div className="float-left">
            <button className="btn-small btn-green btn-right" onClick={() => {this.fetchData()}}>Hae tiedot</button>
          </div>
          {this.renderGraphs()}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { ddata: state.ddata, auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actionCreators, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DiagnosticsViewer)

