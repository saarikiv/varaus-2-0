import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import * as actionCreators from '../../actions/admin.js'

class ShopItemCountForm extends React.Component {
  onSubmit(props) {
    if(this.props.mode === "addNew"){
      this.props.actions.addShopItem(props, "count")
    } else {
      this.props.actions.modifyShopItem(props, "count")
    }
    this.props.actions.minimizeCountShopForm();
  }

  renderField({ input, label, type, placeholder, step, className }) {
    return (
      <div>
        <label htmlFor={input.name}>{label}</label>
        <input {...input} type={type} placeholder={placeholder} step={step} className={className} />
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

    if (this.props.cmp.expanded) {
      return (
        <form onSubmit={handleSubmit(props => this.onSubmit(props))}>
          <Field name="title" component={this.renderField} type="text" label="Otsikko" placeholder="esim: 4 kerran kortti" />
          <Field name="desc" component={this.renderTextarea} label="Kuvaus" placeholder="esim: 4 kertaa saunomista" />
          <Field name="usetimes" component={this.renderField} type="number" label="Käyttömäärä kertoina" placeholder="esim: 4 tai 8" />
          <Field name="expiresAfterDays" component={this.renderField} type="number" label="Kortin umpeutumisaika päivinä" placeholder="esim: 30 tai 60" />
          <Field name="price" component={this.renderField} type="number" step="0.01" label="Verollinen hinta" placeholder="esim: 10.5 tai 50" />
          <Field name="taxpercent" component={this.renderField} type="number" step="0.01" label="Veroprosentti" placeholder="esim: 10.5 tai 50" />
          <Field name="oneTime" component={this.renderField} type="checkbox" label="Kerran ostettava tuote" className="checkbox rowbox" />

          <button className="btn-small btn-blue" type="submit">{buttonText}</button>
        </form>
      )
    }
    else {
      return <div></div>
    }
  }

  render() {
    return (
      <div className="container transparent-bg">
        <div className="surrounded-container">
          <h2 className="header-collapse">Kertakortin tiedot</h2>
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
  return { cmp: state.shopItemCountForm }
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actionCreators, dispatch)}
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(reduxForm({
  form: 'ShopItemCountForm',
  validate
})(ShopItemCountForm))

