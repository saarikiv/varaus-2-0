import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import DiagnosticsHeader from '../components/diagnostics/DiagnosticsHeader.jsx'
import DiagnosticsViewer from '../components/diagnostics/DiagnosticsViewer.jsx'

class Diagnostics extends React.Component {

 constructor(){
   super()
 }

componentDidMount(){
}

componentWillUnmount(){
}

  render() {
    const { currentUser } = this.props;
    
    if(currentUser.key === "0"){
      return <div/>
    }
    
    const isAdmin = currentUser.roles && currentUser.roles.admin === true;
    
    if(isAdmin){
      return (
        <div>
          <DiagnosticsHeader />
          <DiagnosticsViewer />
        </div>
      )
    } else {
      return(
        <div>
          <p>Sinun pitää olla järjestelmän pääkäyttäjä.</p>
          <p>Ota yhteys järjestelmän valvojaan lisäoikeuksien saamiseksi.</p>
       </div>
      )
    }
  }
}

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}
export default connect(mapStateToProps, null)(Diagnostics)

