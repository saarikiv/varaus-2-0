import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/admin.js'

class SlotForm extends React.Component {

  onSubmit(props) {
    if(this.props.mode === "addNew"){
      this.props.actions.addSlot(props)
    } else {
      this.props.actions.modifySlot(props, this.props.itemkey)
    }
    this.props.actions.minimizeSlotForm()
  }

  componentDidMount(){
    const focusElement = document.getElementById("slotFocusItem");
    if(focusElement) focusElement.focus();
  }

  renderSelect({ input, label, children }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <select {...input}>
          {children}
        </select>
      </div>
    )
  }

  renderField({ input, label, type, placeholder, id, className }) {
    return (
      <div>
        <label htmlFor={id || input.name}>{label}</label>
        <input {...input} type={type} id={id} placeholder={placeholder} className={className} />
      </div>
    )
  }

  renderContent() {
    var buttonText = (this.props.mode === "addNew")? "Luo" : "Päivitä"
    const { handleSubmit } = this.props

      return (
        <form onSubmit={handleSubmit(props => this.onSubmit(props))}>
          <Field name="day" component={this.renderSelect} label="Viikonpäivä">
            <option>-- Valitse päivä --</option>
            <option value="1">Maanantai</option>
            <option value="2">Tiistai</option>
            <option value="3">Keskiviikko</option>
            <option value="4">Torstai</option>
            <option value="5">Perjantai</option>
            <option value="6">Lauantai</option>
            <option value="7">Sunnuntai</option>
          </Field>

          <Field name="start" type="number" component={this.renderField} label="Alkaa klo." placeholder="esim: 800 tai 1000 tai 2130" id="slotFocusItem" />
          <Field name="end" type="number" component={this.renderField} label="Loppuu klo." placeholder="esim: 900 tai 1100 tai 2230" />
          <Field name="blocked" type="checkbox" component={this.renderField} label="Vakiovuoro" className="checkbox rowbox" />
          <Field name="reserver" type="text" component={this.renderField} label="Vakiovuoron varaaja" placeholder="Varaajan asunnon numero" />

          <button className="btn-small btn-blue" type="submit">{buttonText}</button>
        </form>
      )
  }

  render() {
    return (
      <div className="container transparent-bg">
        <div className="surrounded-container">
          <h2 className="header-collapse">Vuoron tiedot</h2>
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
  form: 'SlotForm',
  validate
})(SlotForm))

