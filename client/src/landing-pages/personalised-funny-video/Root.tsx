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
  mockedPINState,
} from "../../clients/lp-api/HOC";
import * as RDS from "../../common-types/RemoteDataState";
import { SimpleOpacityTransition, TransitionGroup, simpleOpacityTransitionStyles } from "../../common-components/simple-opacity-transition";
import PhoneInput, { getConfig } from "ouisys-phone-input/dist/common/PhoneInput";
import Disclaimer from "../../legal-components/Disclaimer";


import "./assets/css/style.less?raw";
import CustomTesti from "../bid-win/components/CustomTesti";
import { mockFailureState, mockLoadingState } from "../../clients/mpesa/TolaHOC";
import { mockedSuccessState } from "../../clients/bupper-click2sms/HOC";

const tracker = mkTracker(
  typeof window != "undefined" ? window : null,
  "xx",
  "Personalised Funny Video"
);

const rating = require("./assets/img/rating.svg");
const like = require("./assets/img/eye.svg");

function Wait(props) {
  return (
    <div>
      <Translate id="wait" />
    </div>
  )
}

class MSISDNEntryStep extends React.PureComponent<{
  msisdn: string;
  rds: RDS.RemoteDataState<MSISDNEntryFailure, MSISDNEntrySuccess>;
  onEnd: (msisdn: string) => void;
}> {
  state = {
    msisdn: this.props.msisdn
  };

  phoneInputRef = React.createRef<HTMLInputElement>()
  ref_rockman_id = React.createRef<HTMLInputElement>();
  ref_no_js_form_submission = React.createRef<HTMLInputElement>();


  render() {
    return (
      <form
        onSubmit={ev => {
          ev.preventDefault();
          this.props.onEnd(this.state.msisdn);
        }}
      >

<input type="hidden" name="rockman_id" ref={this.ref_rockman_id} />
      <input type="hidden" name="no_js_form_submission" value="true" ref={this.ref_no_js_form_submission} />

        <div className="input-wrapper custom-top">
          <div className="input-container">
            <div>Your video is ready, <br></br>
              <span className="bold">Enter your phone number to reveal it.</span>
            </div>

            <div className="phone-container">
              <PhoneInput
                inputElementRef={this.phoneInputRef}
                placeholder="Phone number"
                msisdn={this.state.msisdn}
                countryCode={process.env.country}
                showFlag={false}
                showMobileIcon={true}
                showError={true}

                onChange={({ msisdn, isValid, bupperNumber }) => {

                  this.setState({ msisdn, isValid, bupperNumber })
                }
                }

              />
              <button type="submit" className="btn btn-sms uppercase" disabled={RDS.IsLoading(this.props.rds)}>Submit</button>
              {
                RDS.WhenLoading(null, () => <Wait />)(this.props.rds)
              }
              <div className="error-msg">
                {
                  RDS.WhenFailure(null, (err: MSISDNEntryFailure) => <Translate id={err.errorType} />)(this.props.rds)
                }
              </div>
            </div>
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

        <div className="funny-guy-2 funny-guy-pin"></div>
        <div className="masthead-container">
          <div className="ribbon"></div>
          <div className="headline"></div>
          <div className="hand-container">
            <div className="hand-wrapper top31">
              <div className="hand vibrate-2"></div>
            </div>
          </div>
        </div>

        <div className="input-wrapper custom-top">
          <div className="input-container">
            <div>
              <Translate id="we_just_sent_a_pin" />
            </div>
            <div className="pin-input">
              <input
                placeholder="PIN"
                value={this.state.pin}
                onChange={ev => this.setState({ pin: ev.target.value })}
              />
              <button type="submit" className="btn btn-sms" disabled={RDS.IsLoading(this.props.rds)}>CONFIRM</button>
              {
                RDS.WhenLoading(null, () => 'Wait...')(this.props.rds)
              }
            </div>
            <div>
              {
                RDS.match({
                  failure: (err: PINEntryFailure) => (
                    <div>
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
                    <div>
                      <Translate id="didnt_receive_pin_yet" values={{
                        phone: this.props.msisdn
                      }} />&nbsp;
                  <a onClick={() => this.props.backToStart()}>
                        <Translate id="click_here_to_change_your_number" />
                      </a>
                    </div>
                  ),
                  loading: () => null,
                  success: () => null
                })(this.props.rds)
              }
            </div>
          </div>
        </div>
      </form>
    );
  }
}

const TQStep = ({ finalUrl }: { finalUrl: string }) => <div>

<div className="funny-guy-2 funny-guy-pin"></div>
        <div className="masthead-container">
          <div className="ribbon"></div>
          <div className="headline"></div>
          <div className="hand-container">
            <div className="hand-wrapper top31">
              <div className="hand vibrate-2"></div>
            </div>
          </div>
        </div>

  <div className="input-wrapper custom-top">
    <div className="input-container">
      <h3>Thank you!</h3>
      <div className="sub-title">Now you can enjoy full access of funny videos</div>
      <div className="btn-container">
      <a className="btn btn-sms" href={finalUrl}>Access Now</a>
      </div>
    </div>
  </div>
</div>;

class Root extends React.PureComponent<HOCProps> {
  state = {
    locale: "en",
    msisdn: getConfig(process.env.country).commonPrefix,
    preLander: 1,
    rangeValue: "1",
    faceImage:"sad",
    humourImage: "humour-1"
  };

  nextPrelander = () => {
    this.setState({
      preLander: this.state.preLander + 1
    });

  };

  showLoading = () => {
    this.setState({
      preLander: this.state.preLander + 1
    });
    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, 10);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        elem.style.display = 'none';
        // document.getElementById("hideLoading").className = "active";
        document.getElementById("loading-page").className = "hidden";
        document.getElementById("hide-bg").className = "hidden";
      } else {
        width++;
        elem.style.width = width + '%';
      }
    }
  };

  switchImage(val){
    //var myVal = parseInt(val)
    switch (true) {
      case (val < 30):
         this.setState({
           faceImage:"sad"
         })
        break;
      case (val < 65 && val > 30):
        this.setState({
          faceImage:"normal"
        })
        break;
      case (val > 65):
        this.setState({
          faceImage:"happy"
        })
    }
  }

  switchImage2(val){
    //var myVal = parseInt(val)
    switch (true) {
      case (val < 30):
         this.setState({
           humourImage:"humour-1"
         })
        break;
      case (val < 65 && val > 30):
        this.setState({
          humourImage:"humour-2"
        })
        break;
      case (val > 65):
        this.setState({
          humourImage:"humour-3"
        })
    }
  }

  render() {
    return (
    <TranslationProvider locale={this.state.locale}>
      <div>

        <div id="hide-bg" className={"prelander black-bg " + (this.state.preLander === 5 ? "active" : "hidden")}></div>
        {/* 5th PRELANDER */}
        <div id="loading-page" className={"prelander " + (this.state.preLander === 5 ? "active" : "hidden")}>
          <div className="loading-title uppercase">
            Searching...
              </div>
          <div id="myProgress">
            <div id="myBar"></div>
          </div>
        </div>


        <div className={"hidden overlay " + ((this.state.preLander === 2 || this.state.preLander === 3 || this.state.preLander === 4) ? "active" : "")}></div>


        <div className="bg-wrapper">

          <div className="container">
            <div className="topbar">
              <div className="rating">
                <img src={rating} />
              </div>
              <div className="likes">
                <img src={like} /> <span className="bold blue">340k</span> &nbsp;like this page
              </div>
            </div>


            <TransitionGroup>
              {match({
                msisdnEntry: rds => (

                  <div>
                    <div className={"funny-guy vibrate-2 " + ((this.state.preLander === 1 || this.state.preLander === 2 || this.state.preLander === 3 || this.state.preLander === 4) ? "active" : "hidden")}></div>

                    <div className={"hidden funny-guy-2 funny-guy-msisdn " + (this.state.preLander === 5 ? "active" : "")}></div>


                    <div className="masthead-container">
                      <div className="ribbon"></div>
                      <div className="headline"></div>
                    </div>

                    {/* PRELANDER 1 */}
                    <div className={"prelander " + (this.state.preLander === 1 ? "active" : "hidden")}>

                      <div className="btn-container">
                        <button type="button" className="btn" onClick={this.nextPrelander}><Translate id="start" /></button>
                      </div>
                    </div>


                    {/* PRELANDER 2 */}
                    <div className={"prelander faces-wrapper " + (this.state.preLander === 2 ? "active" : "hidden")}>

                      <div className="masthead-container">
                        <div id="faceDefault" className={`faces shake-bottom ${this.state.faceImage}`}></div>
                        <div className="input-wrapper send-to-front">
                          <div className="input-container">
                            <div className="title"><Translate id="tell-mood" /></div>

                            <div className="slidecontainer">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={this.state.rangeValue}
                                className="slider"
                                id="myRange"
                                ref="rangeSlider"
                                onChange={(ev)=>{
                                  this.switchImage(ev.target.value);
                                  this.setState({
                                    rangeValue:ev.target.value
                                  });
                                  
                                }}
                              />
                            </div>


                            <div className="btn-container">
                              <button type="button" className="btn sm" onClick={this.nextPrelander}>NEXT</button>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PRELANDER 3 */}
                    <div className={"prelander faces-wrapper " + (this.state.preLander === 3 ? "active" : "hidden")}>

                      <div className="masthead-container">
                        <div className={`faces shake-bottom ${this.state.humourImage}`}></div>
                        <div className="input-wrapper send-to-front">
                          <div className="input-container">
                            <div className="title">Tell us your sense of humour.</div>

                            <div className="slidecontainer">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={this.state.rangeValue}
                                className="slider"
                                id="myRange"
                                ref="rangeSlider"
                                onChange={(ev) => {
                                  this.switchImage2(ev.target.value);
                                  this.setState({
                                    rangeValue: ev.target.value
                                  });

                                }}
                              />
                            </div>
                            <div className="btn-container">
                              <button type="button" className="btn sm" onClick={this.nextPrelander}>NEXT</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PRELANDER 4 */}
                    <div className={"prelander faces-wrapper " + (this.state.preLander === 4 ? "active" : "hidden")}>

                      <div className="masthead-container">
                        <div className="input-wrapper send-to-front">
                          <div className="input-container">
                            <div className="title">Please select the things that you like</div>
                            <div className="icons-wrapper slide-in-elliptic-top-fwd">

                              <div className="icons-container">
                                <input type="checkbox" value="icon-1" name="icon-1" id="icon-1" />
                                <label htmlFor="icon-1" className="bra"></label>
                              </div>
                              <div className="icons-container">
                                <input type="checkbox" value="icon-2" name="icon-2" id="icon-2" />
                                <label htmlFor="icon-2" className="baby"></label>
                              </div>
                              <div className="icons-container">
                                <input type="checkbox" value="icon-3" name="icon-3" id="icon-3" />
                                <label htmlFor="icon-3" className="chicken"></label>
                              </div>

                            </div>


                            <div className="icons-wrapper slide-in-elliptic-top-fwd">

                              <div className="icons-container">
                                <input type="checkbox" value="icon-4" name="icon-4" id="icon-4" />
                                <label htmlFor="icon-4" className="ball"></label>
                              </div>
                              <div className="icons-container">
                                <input type="checkbox" value="icon-5" name="icon-5" id="icon-5" />
                                <label htmlFor="icon-5" className="cat"></label>
                              </div>
                              <div className="icons-container">
                                <input type="checkbox" value="icon-6" name="icon-6" id="icon-6" />
                                <label htmlFor="icon-6" className="burger"></label>
                              </div>

                            </div>

                            <div className="btn-container">
                              <button type="button" className="btn sm" onClick={this.showLoading}>SEARCH</button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* MSISDN */}
                    <div className={"prelander " + (this.state.preLander === 5 ? "active" : "hidden")}>

                      <div className="hand-wrapper">
                        <div className="hand vibrate-2"></div>
                      </div>

                      <MSISDNEntryStep
                        msisdn={this.state.msisdn}
                        rds={rds}
                        onEnd={msisdn => {
                          this.setState({ msisdn });
                          this.props.actions.submitMSISDN(
                            window,
                            null,
                            msisdn
                          );
                        }}
                      />
                    </div>
                  </div>
                ),


                pinEntry: rds => (

                  <SimpleOpacityTransition key="pinEntry">
                    <div>

                      <PINEntryStep
                        onEnd={pin => this.props.actions.submitPIN(pin)}
                        backToStart={() =>
                          this.props.actions.backToStart()
                        }
                        msisdn={this.state.msisdn}
                        rds={rds}
                      /> </div>
                  </SimpleOpacityTransition>

                ),
                completed: ({ finalUrl }) => (
                  <SimpleOpacityTransition key="completed">
                    <TQStep finalUrl={finalUrl} />
                  </SimpleOpacityTransition>
                )
              })(this.props.currentState)}
            </TransitionGroup>

          </div>

          <CustomTesti
            className="funny-video-testimonial"
            testimonials={
              [
                {
                  Message: () => <span className="message">Nice collection of funny videos.</span>,
                  Name: () => <span className="testimonials-name"> - Ploy</span>,
                  stars: 5
                },
                {
                  Message: () => <span className="message">When I need a laugh, you are here for me</span>,
                  Name: () => <span className="testimonials-name"> - Andy</span>,
                  stars: 5
                },
                {
                  Message: () => <span className="message">Very funny videos with amazing quality.</span>,
                  Name: () => <span className="testimonials-name"> - Tanawat</span>,
                  stars: 5
                }
              ]
            }
          />
          <div className="funny-video-disclaimer">
            This is a subscription service. This game is compatible with most mobile phones with color screen. Supported mobile brands include Nokia, iPhone, Sony, Samsung, Motorola, LG, HTC, Xiaomi and more. No subscription fees will be charged. Maxis: RM4 per message, maximum 7 times per month, max of RM30(excl. GST) per month. Normal mobile operator network charges apply. GPRS / 3G access needs to be enabled to download the content. Data charges are billed separately. Some phones do not support GPRS / 3G. Please seek parental or guardian approval if you are 18 years old or below. Helpdesk 03-74910666 (9am-5pm Mon-Fri). To cancel send STOP ALARM to 36099. Buz2mobile operates according to the Malaysian code of conduct for SMS services. Powered by Moblife. TV Sdn Bhd.
        </div>
        </div>

      </div>
    </TranslationProvider>
    );
  }
}
export default HOC(tracker, Root)(initialState);