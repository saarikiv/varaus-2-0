import React from "react";
import { Link, useNavigate } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { reduxForm, Field } from 'redux-form'

import * as actionCreators from '../../actions/auth.js'

class HomeLoginRegister extends React.Component {

  constructor(){
    super();
  }

  onSubmit(props) {
    this.props.actions.login(props.email, props.password)
  }

  componentDidUpdate(prevProps){
    if(!prevProps.auth.uid && this.props.auth.uid){
      if(this.props.navigate) {
        this.props.navigate('/user');
      }
    }
  }

  renderField({ input, label, type, meta: { touched, error } }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <input {...input} id={input.name} type={type} placeholder={label} />
        {touched && error && <span className="error">{error}</span>}
      </div>
    )
  }

  renderForm() {
    const { handleSubmit } = this.props

    return (
      <form onSubmit={ handleSubmit(props => this.onSubmit(props)) }>            
        <Field name="email" type="email" component={this.renderField} label="Sähköposti" />
        <Field name="password" type="password" component={this.renderField} label="Salasana" />
        <button className="btn-small btn-blue" type="submit">Kirjaudu</button>
        <Link to="forgotPassword" className="mini-link">Unohditko salasanasi?</Link>  
      </form>
    )
  }


  render() {
    return (
      <div class="container bordered-container centered">

        <h3 className="centered login-header margin-bottom">Kirjaudu sisään</h3>
        <div className="content-container login-container">          
          {this.renderForm()}
        </div>

        <div className="register-container">
          <p>Oletko uusi käyttäjä?</p>
          <Link className="btn-small btn-green text-bold" to="register">Rekisteröidy</Link>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

// First apply reduxForm, then connect to Redux
import { connect } from 'react-redux'

// HOC to provide navigate function to class component
function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  }
}

export default withNavigate(connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm({
  form: 'LoginForm'
})(HomeLoginRegister)))
