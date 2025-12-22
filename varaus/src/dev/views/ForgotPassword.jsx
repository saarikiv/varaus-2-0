import React from "react";
import { Link, useNavigate } from "react-router-dom"
import { bindActionCreators } from 'redux'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'

import * as actionCreators from '../actions/user.js'

class ForgotPassword extends React.Component {

    onSubmit(props) {
        this.props.actions.resetPassword(props.email)
        if(this.props.navigate) {
          this.props.navigate('/');
        }
    }

    renderField({ input, label, type }) {
        return (
            <div>
                <label htmlFor={input.name}>{label}</label>
                <input {...input} type={type} />
            </div>
        )
    }

    renderForm() {
        const { handleSubmit } = this.props

        return (
            <form onSubmit={ handleSubmit(props => this.onSubmit(props)) }>
                <Field name="email" type="email" component={this.renderField} label="Sähköposti" />
                <button className="btn-small btn-blue" type="submit">Lähetä</button>
            </form>
        )        
    }

    render() {
        return (
            <div class="container centered">
                <Link className="text-link back-btn" to="/">&lt;Takaisin</Link>
                <h2 className="centered login-header">Unohditko salasanasi?</h2>
                <div className="content-container login-container align-left">
                    <p className="text-fade margin-top margin-bottom small-info pushed">Anna sähköpostiosoitteesi. Lähetämme sinulle salasanan vaihtolinkin.</p>
                    <p className="text-fade margin-top margin-bottom small-info pushed">Sähköpostin saapumisessa voi kestää tovi.</p>
                    {this.renderForm()}
                </div>
            </div>
        )
    }
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

export default withNavigate(connect(null, mapDispatchToProps)(reduxForm({
  form: 'ForgotPasswordForm'
})(ForgotPassword)))


