import React from "react";

import UserList from '../admin/UserList.jsx'

export default class CashPayment extends React.Component {

  render() {
    return(
      <div>
        <div className="content-container">
          <button className="btn-small btn-red margin-top" onClick={() => this.props.actions.resetShop()} > Peru osto </button>
          <h3> Valitse käyttäjä, jolle osto suoritetaan.</h3>
        </div>
        <UserList />
      </div>  
    )
  }
}

