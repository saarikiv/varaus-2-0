import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/admin.js'

class InfoForm extends React.Component {

  onSubmit(props) {

    if(this.props.mode === "addNew"){
      this.props.actions.addInfo(props)
    } else {
      this.props.actions.modifyInfo(this.props.dbKey, props)
    }
    this.props.actions.minimizeInfoForm();
  }

  renderField({ input, label, placeholder }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <input {...input} type="text" placeholder={placeholder} />
      </div>
    )
  }

  renderTextarea({ input, label, placeholder }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <textarea {...input} placeholder={placeholder} />
      </div>
    )
  }

  renderContent() {

    var buttonText = (this.props.mode === "addNew")? "Luo" : "Päivitä"
    const { handleSubmit } = this.props

    return (
        <form onSubmit={handleSubmit(props => this.onSubmit(props))}>
          <Field name="title" component={this.renderField} label="Infon otsikko" placeholder="esim: saunasta..." />
          <Field name="content" component={this.renderTextarea} label="Infon kuvaus" placeholder="esim: sauna on lämmin ja rentoutumiselle omiaan." />

          <button className="btn-small btn-blue" type="submit">{buttonText}</button>
        </form>
      )
  }

  render() {


    return (
      <div className="container transparent-bg">
       	<div className="surrounded-container">
          <h2 className="header-collapse">Infon tiedot</h2>
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



function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(null, mapDispatchToProps)(reduxForm({
  form: 'InfoForm',
  validate
})(InfoForm))

