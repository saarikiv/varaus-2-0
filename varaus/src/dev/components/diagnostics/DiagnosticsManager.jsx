import React from "react";
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as actionCreators from '../../actions/diagnostics.js'

class DiagnosticsManager extends React.Component {


  componentWillMount() {
    this.props.actions.startDiagnostics();
    this.props.actions.flushDiagnosticsAtInterval(10*1000);
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.diag.flushed){
      this.props.actions.flushDiagnosticsAtInterval(10*1000);
    }
  }

  componentWillUnmount() {
    this.props.actions.flushDiagnostics();
  }


  render() {
    return <div></div>
  }
}

function mapStateToProps(state) {
  return { diag: state.diagnostics, auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actionCreators, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DiagnosticsManager)

