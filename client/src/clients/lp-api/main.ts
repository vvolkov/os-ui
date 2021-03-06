export type IConfig = {
  host?: string, country?: string, handle?: string, offer: number
}

export type IResult = {
  finalUrl?: string,
  isValid: boolean,
  errorText?: string,
  errorType?: string,
  submissionId?: string
}

const scenario = process.env.scenario

const defaultConfig = (offer: number) : IConfig => {
  switch(process.env.country) {
    case "gr":
      if(/gr-ast54006-pin/ig.test(scenario) || (!!process.env.scenarioName && /54006/ig.test(process.env.scenarioName))) { 
        //GR AST@54006 [PIN]
        return {
          offer,
          host: 'n.appspool.net',
          country: 'gr',
          handle: 'gr-ast54006-pin'
        }
      } else if(/gr-gmz19366-pin/ig.test(scenario)) {
        return {
          offer,
          host: 'n.appspool.net',
          country: 'gr',
          handle: 'gr-gmz19366-pin'
        }
      } else if(/gr-aps54006-pin/ig.test(scenario)) {
        return {
          offer,
          host: 'n.appspool.net',
          country: 'gr',
          handle: 'gr-aps54006-pin'
        }
      } else if (/gr-wmi54006-pin/ig.test(scenario)) {
        return {
          offer,
          host: 'n.winimi.com',
          country: 'gr',
          handle: 'gr-wmi54006-pin'
        }
      } else {
        return {
          offer,
          host: 'm.mobiworld.biz',
          country: 'gr',
          handle: 'gr-mc54444-pin'
        }
    }
    case "iq": {
      return {
        offer,
        host: 'n.mobfun.co',
        country: 'iq',
        handle: 'mobile-arts'
      }
    }
    case "qa": {
      return {
        offer,
        host: 'w1.mozzi.com',
        country: 'qa',
        handle: 'finger-print-lock'
      }
    }
    case "bh": {
      return {
        offer,
        host: 'n.game-lords.com',
        country: 'bh',
        handle: 'win-cash'
      }
    }
    case "ae": {
      return {
        offer,
        host: 'n.mobfun.co',
        country: 'ae',
        handle: 'general-download-1'
      }
    }
    case "ee": {
      return {
        offer,
        host: "w1.mozzi.com",
        country: "ee",
        handle: "ee-astro15181-pin"
      }
    }
    default:
      const errorMsg = `'country' environment variable is either missing or has an unsupported value (${process.env.country}). This is necessary for defaultConfig(offer).`
      console.error(errorMsg)
      throw errorMsg;
  }
}

export default async function submitMSISDN(window: Window, maybeConfig: IConfig, msisdn: string): Promise<(pin: string) => Promise<string>> {
  const config = !maybeConfig ? {offer: window.pac_analytics.visitor.offer} : maybeConfig
  const { host, country, handle, offer } = !config.host || !config.handle || !config.country ? defaultConfig(config.offer) : config
  const search = window.location.search.substr(1) || ''
  const result : IResult = await fetch(`https://lp-api.sam-media.com/v1/submit_msisdn/${host}/${country}/${handle}/${offer}/?msisdn=${msisdn}&rockman_id=${window.pac_analytics.visitor.rockmanId}&${search}`).then(x => x.json())
  if(!result.isValid) {
    const error = new Error(`${result.errorType}:\n${result.errorText}`)
    error['type'] = result.errorType;
    console.error(error)
    throw error
  } else {
    return async function submitPIN(pin: string) : Promise<string> {
      const pinResult : IResult = await fetch(`https://lp-api.sam-media.com/v1/submit_pin?pin=${pin}&sid=${result.submissionId}`).then(x => x.json())
      if(!pinResult.isValid) {
        const pinError = new Error(`${pinResult.errorType}:\n${pinResult.errorText}`)
        pinError['type'] = pinResult.errorType;
        throw pinError
      } else {
        return pinResult.finalUrl
      }
    }
  }
}