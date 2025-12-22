import React from "react";
import { Link } from "react-router-dom"
import { connect } from 'react-redux'

class LoadingScreen extends React.Component {

  renderLoadingImage(success) {
    if (success === true) {
      return <img className="loading-img" src="./assets/success.png" />
    } else if (success === false) {
      return <img className="loading-img" src="./assets/error.png" />
    } else {
      return <img className="loading-img rolling" src="./assets/loading.png" />
    }
  }

  render() {
    const {loadingScreen} = this.props

    if(loadingScreen.visible){
      return (
        <div className="slot-info-container">
          <div className="outer">
            <div className="middle">
              <div className="inner centered">
                {this.renderLoadingImage(loadingScreen.success)}
                <h5 className="text-bold pre-wrap text-fade"> {loadingScreen.context} </h5>
              </div>
            </div>
          </div>          
       </div>
      );
    } else {
      return (
        <div>
        </div>
      );
    }
  }
}

function mapStateToProps(state) {
  return { loadingScreen: state.loadingScreen }
}

export default connect(mapStateToProps, null )(LoadingScreen)

