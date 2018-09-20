import * as React from "react"
import * as TAPI from "./TolaAPI"
import * as RDS from "../common-types/RemoteDataState"

export type ITolaProps = {
  currentState: TAPI.TolaRDS;
  actions: TAPI.ITolaActions;
};

export default (Comp: React.ComponentType<ITolaProps>) => (initState: TAPI.TolaRDS) => 
  class HOC extends React.Component {
    state: {
      current: TAPI.TolaRDS;
    };
    actions: TAPI.ITolaActions; 
    constructor(props: any) {
      super(props);
      this.state = {
        current: initState
      };
      const self = this;
      this.actions = {
        chargeAndWait: (msisdn: string, message: string, price: number) =>
          TAPI.chargeAndWait(msisdn, message, price, st =>
            self.setState({ current: st })
          ),
        backToNothingYet: () => self.setState({ current: RDS.NothingYet() })
      };
    }

    render() {
      console.log("HOC", this.props, this.context)
      const self = this;
      return (
        <Comp
          actions={self.actions}
          currentState={self.state.current}
          {...this.props}
        />
      );
    }
  }



