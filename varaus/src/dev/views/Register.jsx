import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

import * as actionCreators from '../actions/auth.js'
import Terms from '../components/home/Terms.jsx'
import { validateRegistration } from '../helpers/validationHelper.js'

class Register extends React.Component {

  constructor(){
    super();
    this.termsOpen = false;
  }

  componentDidUpdate(prevProps){
    if(!prevProps.auth.uid && this.props.auth.uid){
      if(this.props.navigate) {
        this.props.navigate('/user');
      }
    }
  }

  doRegister(data){
    this.props.actions.register(data.email, data.password, data.firstName, data.lastName, null)
  }

  toggleTerms() {
    if (this.termsOpen === false) {
      document.getElementById("terms-container").classList.remove("hidden")
      this.termsOpen = true
    } else {
      document.getElementById("terms-container").classList.add("hidden")
      this.termsOpen = false
    }
  }

  renderField({ input, label, type, placeholder, meta: { touched, error } }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <input {...input} type={type} placeholder={placeholder} />
        {touched && error && <div className="form-error">{error}</div>}
      </div>
    )
  }

  renderCheckbox({ input, label, className, meta: { touched, error } }) {
    return (
      <div>
        <input {...input} type="checkbox" className={className} />
        <label htmlFor={input.name} className="inline-label">{label}</label>
        {touched && error && <div className="form-error">{error}</div>}
      </div>
    )
  }

  renderForm() {
    const { handleSubmit } = this.props

    return (
      <form onSubmit={handleSubmit(data => { this.doRegister(data) })}>
        <Field name="email" type="email" component={this.renderField} label="Sähköposti" placeholder="Sähköposti" />
        <Field name="password" type="password" component={this.renderField} label="Salasana" placeholder="Salasana" />
        <Field name="firstName" type="text" component={this.renderField} label="Etunimi" placeholder="Etunimi" />
        <Field name="lastName" type="text" component={this.renderField} label="Sukunimi" placeholder="Sukunimi" />

        <a className="text-link block centered margin-bottom cursor-pointer" onClick={() => this.toggleTerms()}>Käyttöehdot</a>
        <div id="terms-container" className="hidden">
          <Terms />
        </div>

        <Field name="terms" component={this.renderCheckbox} label="Hyväksyn käyttöehdot" className="checkbox" />
        <button type="submit" className="btn-small btn-blue">Rekisteröidy</button>
      </form>
    );

  }

  render() {
      return (
        <div class="container">
          <div className="centered">
            <Link className="text-link back-btn" to="/">&lt;Takaisin</Link>
          </div>
          <h2 className="centered login-header">Rekisteröidy käyttäjäksi</h2>          
          <div className="content-container login-container">
            <p className="text-fade margin-top margin-bottom small-info pushed">Rekisteröidythän aktiivisella sähköpostilla! Lähetämme mahdolliset kuitit ja vuorojen perumiset sähköpostiisi.</p>
            <p className="text-fade margin-top margin-bottom small-info pushed">Sähköpostiosoitetta käytetään vain vahvistus ja tiedotus viestien lähetykseen. Sähköpostitietoja ei luovuteta kolmannelle osapuolelle mitään tarkoitusta varten.</p>
            {this.renderForm()}
          </div>  
        </div>
      );
  }
}

const validate = validateRegistration;

function mapStateToProps(state) {
  return { auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch) }
}

function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  }
}

export default withNavigate(connect(mapStateToProps, mapDispatchToProps)(reduxForm({
  form: 'RegisterForm',
  validate
})(Register)))

