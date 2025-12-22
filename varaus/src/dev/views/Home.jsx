import React from "react";
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import HomeLoginRegister from '../components/home/HomeLoginRegister.jsx'
import ContactInfo from '../components/home/ContactInfo.jsx'

class Home extends React.Component {

  componentDidMount(){
    if(this.props.auth.uid) {
      this.props.navigate('/user');
    }
  }

  componentDidUpdate(prevProps){
    if(!prevProps.auth.uid && this.props.auth.uid) {
      this.props.navigate('/user');
    }
  }

  render() {
    return (
      <div>
        <HomeLoginRegister />
        <ContactInfo />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return { auth: state.auth }
}

// HOC to provide navigate function to class component
function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  }
}

export default withNavigate(connect(mapStateToProps, null)(Home))

