import React from 'react'

export default class ShopHeader extends React.Component {
  render() {
    return (
      <div class="container header-container">
        <div className="content-container">
          <h1>Kauppa</h1>
          <small className="text-fade margin-top margin-bottom small-info">Osta täältä varauskertoja!</small>
          <small className="text-fade margin-top margin-bottom small-info">Osto tapahtuu painamalla "OSTA" painiketta ja varmistamalla painamalla esiin tulevaa "VAHVISTA OSTO" painiketta.</small>
          <small className="text-fade margin-top margin-bottom small-info">Vahvistettuasi oston, sinulle myönnetään varausoikeuksia välittömästi.</small>
          <small className="text-fade margin-top margin-bottom small-info">Lasku ostosta lähetetään sähköpostiisi.</small>
        </div>
      </div>
    )
  }
}

