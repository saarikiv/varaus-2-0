import React from 'react'

import ContactInfo from '../components/home/ContactInfo.jsx'

export default class LockedUser extends React.Component {

  render() {
    return (
      <div>
       <h3 className="centered"> Käyttäjtunnuksesi on lukittu</h3>
       <p className="centered">Ole yhteydessä isännöitsijään sen jälleen avaamiseksi</p>
       <ContactInfo />
      </div>
    );
  }
}


