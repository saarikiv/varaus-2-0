import React from 'react'

export default class InfoItem extends React.Component {
  render() {
    const { item } = this.props
    return (
      <li>
        <h2 className="margin-bottom nopadding">{item.title}</h2>
        <p className="nomargin nopadding">{item.content}</p>
      </li>
    );
  }
}

