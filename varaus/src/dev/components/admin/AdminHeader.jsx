import React from 'react'
import { Link } from 'react-router-dom'

export default class AdminHeader extends React.Component {
  render() {
    return (
      <div class="container header-container">
        <div className="content-container">          
          <h1>Hallinnointisivu</h1>
        </div>
      </div>
    );
  }
}

