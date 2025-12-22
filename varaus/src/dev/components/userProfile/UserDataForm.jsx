import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/user.js'

class UserDataForm extends React.Component {

  onSubmit(props) {
    var user = {
      uid: this.props.auth.uid,
      firstname: props.firstname,
      lastname: props.lastname,
      alias: null
    }
    this.props.actions.updateUserDetails(user)
  }

  renderField({ input, label, type, id }) {
    return (
      <div>
        <label htmlFor={id || input.name}>{label}</label>
        <input {...input} id={id || input.name} type={type} />
      </div>
    )
  }

  renderContent() {
    if(!this.props.currentUser) return( <div></div>)

    const { handleSubmit } = this.props

      return (
        <form onSubmit={handleSubmit(props => this.onSubmit(props))}>
          <Field name="firstname" type="text" component={this.renderField} label="Etunimi" id="firstName" />
          <Field name="lastname" type="text" component={this.renderField} label="Sukunimi" id="lastName" />

          <p>Sähköpostisi: {this.props.currentUser.email}</p>

          <button className="btn-small btn-blue" type="submit">Päivitä</button>
        </form>
      )
  }


  render() {
    return (
      <div className="container bordered-container">
        <div className="content-container">
          <h2 className="header-collapse">Tallennetut tietosi</h2>
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

function validate(values) {
  const errors = {}
  return errors;
  // TODO: form validation
}

function mapStateToProps(state) {
  return { initialValues: state.currentUser, auth: state.auth, currentUser: state.currentUser }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(mapStateToProps, mapDispatchToProps)(reduxForm({
  form: 'UserDataForm',
  enableReinitialize: true
})(UserDataForm))

