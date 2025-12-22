import React from 'react'
import { reduxForm, Field } from 'redux-form'
import { useNavigate } from 'react-router-dom'

import { sendFeedback } from '../actions/user.js'
import ContactInfo from '../components/home/ContactInfo.jsx'

class Feedback extends React.Component {

  onSubmit(props){
    this.props.sendFeedback(props.feedback)
    if(this.props.navigate) {
      this.props.navigate('/user');
    }
  }

  renderTextarea({ input, meta: { touched, error } }) {
    return (
      <div>
        <textarea {...input} type="text" id="feedback" />
        {touched && error && <div className="form-error">{error}</div>}
      </div>
    )
  }

  render() {
    const { handleSubmit } = this.props

    return (
      <div className="container">
        <div className="content-container login-container">
            <form onSubmit={handleSubmit(props => this.onSubmit(props))}>
                <h5>Lähetä palautetta varausjärjestelmästä</h5>
                <Field name="feedback" component={this.renderTextarea} />
                <button type="submit" className="btn-small btn-blue">Lähetä</button>
            </form>
        </div>
      </div>
    )
  }
}

function validate(values) {
  const errors = {}

  if (!values.feedback) {
    errors.feedback = "Palautteella tulee olla sisältö."
  }

  return errors;
}

import { connect } from 'react-redux'

// HOC to provide navigate function to class component
function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  }
}

const mapDispatchToProps = {
  sendFeedback
}

export default withNavigate(connect(
  null,
  mapDispatchToProps
)(reduxForm({
  form: 'FeedbackForm',
  validate
})(Feedback)))
