import React from "react"
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { createFeedback } from '../../actions/feedback.js'

class Feedback extends React.Component {
  renderTextarea({ input, meta: { touched, error } }) {
    return (
      <div>
        <label>Kirjoita palaute</label>
        <textarea {...input}></textarea>
        <p className="form-error">
          {touched ? error : ""}
        </p>
      </div>
    )
  }

  render() {
    const { handleSubmit } = this.props

    return (
      <div className="container">
        <form onSubmit={handleSubmit(this.props.createFeedback)}>
          <Field name="content" component={this.renderTextarea} />
          <button type="submit">Lähetä</button>
        </form>
      </div>
    )
  }
}

function validate(values) {
  const errors = {}

  if (!values.content) {
    errors.content = "Kirjoita jotain."
  }

  return errors
}

export default connect(null, {createFeedback})(reduxForm({
  form: 'FeedbackFrom',
  validate
})(Feedback))

