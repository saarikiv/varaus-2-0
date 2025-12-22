import React from "react";

export default class Terms extends React.Component {
  render() {
    const {item} = this.props
    return (
      <li> 
        <p className="text-fade text-bold nomargin nopadding">{item.title}</p>
        <p className="text-fade nomargin nopadding">{item.content}</p>
      </li>
    )
  }
}

