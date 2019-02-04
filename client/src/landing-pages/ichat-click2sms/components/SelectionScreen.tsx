import * as React from "react";
import { Translate } from "./../localization/index"

interface IProps {
  onSelected
}

export default class SelectionScreen extends React.PureComponent<IProps>{


  render() {

    return (<div className="selectionScreen">

      <div className="header">

        <Translate id="select_header_text1" defaultMessage=" Get exclusive live" />
        <strong><Translate id="select_header_text2" defaultMessage="Astrology" /></strong>
        <span><Translate id="select_header_text3" defaultMessage="reading today!" /></span>

      </div>

      <div className="question">

        <Translate id="question_text" defaultMessage="What do you want to know about?" />

      </div>

      <div className="button-holder">

        <button onClick={() => this.props.onSelected({ keyData: "Love" })}><Translate id="love" defaultMessage="Love" /></button>
        <button onClick={() => this.props.onSelected({ keyData: "Luck" })}><Translate id="luck" defaultMessage="Luck" /></button>
        <button onClick={() => this.props.onSelected({ keyData: "Money" })}><Translate id="money" defaultMessage="Money" /></button>
        <button onClick={() => this.props.onSelected({ keyData: "Family" })}><Translate id="family" defaultMessage="Family" /></button>
        <button onClick={() => this.props.onSelected({ keyData: "Work" })}><Translate id="work" defaultMessage="Work" /></button>

      </div>

    </div>)

  }


}