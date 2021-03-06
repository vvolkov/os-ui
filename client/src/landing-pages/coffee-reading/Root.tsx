import * as React from "react";
import mkTracker from "../../pacman/record";
import { TranslationProvider, Translate } from "./localization/index";
import HOC, {
  initialState,
  mockedCompletedState,
  HOCProps,
  MSISDNEntryFailure,
  MSISDNEntrySuccess,
  PINEntryFailure,
  PINEntrySuccess,
  match,
  mockedPINState
} from "../../clients/lp-api/HOC";
import * as RDS from "../../common-types/RemoteDataState";
import "./assets/css/styles.less?raw";
import ShakeScreen from "./components/ShakeScreen";
import { mockSuccessState } from "../../clients/mpesa/TolaHOC";

const imgCupA = require("./assets/img/readingcup1.png");
const imgCupB = require("./assets/img/readingcup2.png");
const imgCupC = require("./assets/img/readingcup3.png");

const tracker = mkTracker(
  typeof window != "undefined" ? window : null,
  "xx",
  "Coffee Reading" //TODO: replace Unknown with your page's name
);

class MSISDNEntryStep extends React.PureComponent<{
  msisdn: string;
  checked: boolean;
  rds: RDS.RemoteDataState<MSISDNEntryFailure, MSISDNEntrySuccess>;
  onEnd: (msisdn: string, checked: boolean) => void;
}> {
  state = {
    msisdn: this.props.msisdn,
    checked: this.props.checked,
    validationError: null
  };
  render() {
    return (
      <form
        onSubmit={ev => {
          ev.preventDefault();
          if (this.state.msisdn == "") {

            this.setState({ validationError: "Παρακαλώ βάλε έναν έγκυρο αριθμό." })
            console.log("Please fill in your mobile number!");

          } else if (!this.state.checked) {

            this.setState({ validationError: "Παρακαλώ αποδέξου τους Όρους & Προϋποθέσεις" })
            console.log("Please agree to the terms and conditions!");

          } else {
            this.setState({ validationError: null })
            this.props.onEnd(this.state.msisdn, this.state.checked);
          }
        }}
      >
        <div>
          <input
            type="tel"
            placeholder="Phone number"
            value={this.state.msisdn}
            onChange={ev => this.setState({ msisdn: ev.target.value })}
          />

        <div>

          {
            RDS.WhenLoading(null, () => <div className="wait-msg"><Translate id="waitingText" defaultMessage="Please wait..." /></div>)(this.props.rds)
          }

          {
            RDS.WhenFailure(null, (err: MSISDNEntryFailure) => <div className="error-msg"><Translate id={err.errorType} /></div>)(this.props.rds)
          }

          {
            this.state.validationError != null
              ? <div className="error-msg">{this.state.validationError}</div>
              : null
          }
        </div>

          <button type="submit" disabled={RDS.IsLoading(this.props.rds)}><Translate id="msisdn_btn_send" defaultMessage="Submit" /></button>
       

          <div className="terms">

            <input type="checkbox" checked={this.state.checked} onChange={ev => this.setState({ checked: ev.target.checked })} name="agree" id="agree" />
            <label htmlFor="agree">
              <Translate id="alternate_accept_first" defaultMessage="Terms" /> 
            &nbsp;<a href="http://n.mobioastro.com/gr/tnc-mobioastro?offer=1&_next=general_conditions.html" target="_blank"> 
               <Translate id="text_terms" defaultMessage="Terms &amp; Conditions" /> </a>

              <Translate id="alternate_accept_second" defaultMessage="Conditions" /> 
              &nbsp;&nbsp;<a href="http://paydash.gr/pinakas-ypp/" target="_blank"> 
               <Translate id="text_price" defaultMessage="Final message price" /> </a>
            </label>

          </div>

        </div>
   
      </form>
    );
  }
}

class PINEntryStep extends React.PureComponent<{
  msisdn: string;
  rds: RDS.RemoteDataState<PINEntryFailure, PINEntrySuccess>;
  backToStart: () => void;
  onEnd: (pin: string) => void;
}> {
  state = {
    pin: ""
  };
  render() {
    return (
      <form
        onSubmit={ev => {
          ev.preventDefault();
          this.props.onEnd(this.state.pin);
        }}
      >
        <div className="titlePIN">
          <Translate id="we_just_sent_a_pin" />
        </div>
        <div>
          <input
            type="tel"
            placeholder="PIN"
            value={this.state.pin}
            onChange={ev => this.setState({ pin: ev.target.value })}
          />
          <button type="submit" disabled={RDS.IsLoading(this.props.rds)}><Translate id="pin_btn_send" defaultMessage="Submit" /></button>
          {
            RDS.WhenLoading(null, () => <div className="wait-msg"><Translate id="waitingText" defaultMessage="Please wait..." />.</div>)(this.props.rds)
          }
        </div>
        <div>
          {
            RDS.match<PINEntryFailure, PINEntrySuccess, any>({
              failure: (err: PINEntryFailure) => (
                <div className="messagePIN">
                  <div><Translate id={err.errorType} /></div>
                  <Translate id="if_not_your_mobile" values={{
                    phone: this.props.msisdn
                  }} />&nbsp;
                  <a onClick={() => this.props.backToStart()}>
                    <Translate id="click_here_to_change_your_number" />
                  </a>
                </div>
              ),
              nothingYet: () => (
                <div className="messagePIN">
                  <Translate id="didnt_receive_pin_yet" values={{
                    phone: this.props.msisdn
                  }} />&nbsp;
                  <a onClick={() => this.props.backToStart()}>
                    <Translate id="click_here_to_change_your_number" />
                  </a>
                </div>
              ),
              loading: () => null,
              success: ({finalUrl}) => null
            })(this.props.rds)
          }
        </div>
      </form>
    );
  }
}

const TQStep = ({ finalUrl }: PINEntrySuccess) => <div>
  <h3><Translate id="congratsTitle" defaultMessage="Congratulations!" /></h3>
  <p><Translate id="congratsText" defaultMessage="You have successfully enrolled in the service." /></p>
  <a href={finalUrl} className="button"><Translate id="portalBtnText" defaultMessage="Go to portal page" /></a>
</div>;


class Root extends React.PureComponent<HOCProps> {
  state = {
    locale: "el",
    msisdn: "69",
    checked: false,
    applicationState: "intro"
  };

  render() {
    return (
      <div className={`container display-${this.state.applicationState}`}>

        <TranslationProvider locale={this.state.locale}>

          <div>

            <div className="infoBox"><Translate id="infoBox" defaultMessage="The most famous reading of coffee" /></div>

            <div className="title"></div>

            <div className="panel intro">

              <div className="subTitle"><Translate id="mainSubTitle" defaultMessage="Do you want to learn your future?" /></div>

              <ul className="idleCoffee">

                <li className="idle"></li>
                <li className="smoke"></li>

              </ul>

              <button onClick={() => { 
                this.setState({ applicationState: 'shake' }) ; 
                tracker.advancedInPreFlow("first-click");
              }}><Translate id="introBtnText" defaultMessage="I want to know" /></button>

            </div>

            <div className="panel shake">

              <div className="subTitle"><Translate id="shakeSubTitle" defaultMessage="Make a wish and shake your phone 3 times" /></div>

              <div className="CoffeCup">
                {this.state.applicationState == "shake" ? <ShakeScreen onShakeEvent={() => {
                  tracker.advancedInPreFlow("shake");
                  this.setState({ applicationState: 'reading' })
                  }} /> : null}
              </div>

              <div className="instructions">
                <Translate id="shakeInsText" defaultMessage="The future is in your hand..." />
              </div>

              {/*<button onClick={() => { this.setState({ applicationState: 'reading' }) }}>Next Page</button>*/}

            </div>

            <div className="panel reading">

              <div className="subTitle"><Translate id="readingSubTitle" defaultMessage="Your cup is ready..." /></div>

              <div className="reverseCoffeCup"></div>

              <div className="instructions">
                <Translate id="readingInsText" defaultMessage="Are you ready to learn your future?" />
              </div>

              <button onClick={() => { 
                this.setState({ applicationState: 'results' }); 
                tracker.advancedInPreFlow("results");
                }}><Translate id="show_me" defaultMessage="Show me" /></button>

            </div>

            <div className="panel results">

              <div className="subTitle"> <Translate id="resultsSubTitle" defaultMessage="Your reading is ready..." /></div>

              <ul className="cupResults">
                <li className="animated fadeInUp delay-1"><img src={imgCupA} alt="cup result" /></li>
                <li className="animated fadeInUp delay-2"><img src={imgCupB} alt="cup result" /></li>
                <li className="animated fadeInUp delay-3"><img src={imgCupC} alt="cup result" /></li>
              </ul>

              <div className="holder animated fadeInUp delay-3">
                {match({
                  msisdnEntry: rds => (
                    <div className="numberEntry">

                      <h1><Translate id="numberEntryFirst" defaultMessage="To get your reading result of your coffee" />
                        <strong><Translate id="numberEntryNext" defaultMessage="Put your mobile number below" /></strong></h1>

                      <MSISDNEntryStep
                        msisdn={this.state.msisdn}
                        checked={this.state.checked}
                        rds={rds}
                        onEnd={(msisdn, checked) => {

                          this.setState({ msisdn, checked });
                          this.props.actions.submitMSISDN(window, null, msisdn);

                        }}

                      />
                    </div>
                  ),
                  pinEntry: rds => (

                    <div className="pinEntry">

                      <PINEntryStep
                        onEnd={pin => this.props.actions.submitPIN(pin)}
                        backToStart={() => this.props.actions.backToStart()}
                        msisdn={this.state.msisdn}
                        rds={rds}
                      />

                    </div>

                  ),
                  completed: ({ finalUrl }) => (

                    <div className="congrats">

                      <TQStep finalUrl={finalUrl} />

                    </div>

                  )
                })(this.props.currentState)}
              </div>

            </div>

            {/*
            <ul className="socialproof">

              <li>
                <span className="userIcon"></span>
                <p><Translate id="socialUsersText" defaultMessage="5 Million Users" /></p>
              </li>

              <li><span className="vl"></span></li>

              <li>
                <span className="coffeeIcon"></span>
                <p><Translate id="socialReadingText" defaultMessage="25 Million Readings" /></p>
              </li>

            </ul>
            */}

          </div>

        </TranslationProvider>

        <div className="footer-gr">

          <ul>
            <a href="http://www.mesa.com.gr" className="mesa" target="_blank"></a>
            <li className="gr-title"><i className="info">i</i> Καρτέλα Συνδρομητικής Υπηρεσίας</li>
            <li>Όνομα <span>Mobioastro</span></li>
            <li>Περιγραφή <span>Yπηρεσία Παροχής Περιεχομένου. Θα λαμβάνετε 3 ως 12 SMS ανά εβδομάδα</span></li>
            <li>Χρέωση <span>€6.24/Εβδομάδα, 3SMS, €2.08 έκαστο ή ως 12SMS,€0.52 έκαστο <a href="http://paydash.gr/pinakas-ypp/" target="_blank">Τελική τιμή με φόρους</a></span></li>
            <li>Πάροχος Υπηρεσίας <span>PAYDASH Μονοπρόσωπη ΙΚΕ</span></li>
            <li>Επικοινωνία <span>2111881788,  <a href="mailto:c.support@paydash.gr">c.support@paydash.gr</a></span></li>
            <li>Διαγραφή <span>Στείλε STOP AST στο 54006 ή στο 54018. Απλή χρέωση SMS στην αποστολή.</span></li>
            <li>Όροι <span><a href="http://n.mobioastro.com/gr/tnc-mobioastro?offer=1&_next=general_conditions.html" target="_blank">Όροι &amp; Προϋποθέσεις</a>&nbsp;/&nbsp;<a href="http://n.mobioastro.com/gr/tnc-mobioastro?offer=1&_next=privacy_policy.html" target="_blank">Πολιτική Απορρήτου</a></span></li>
          </ul>

        </div>

      </div>
    );
  }
}
export default HOC(tracker, Root)(initialState);