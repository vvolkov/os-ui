import express from "express";
import prepare from "./prepare";
import prepareStatic from "./prepare-static";
import uuid from "uuid/v1";
import R from 'ramda';
import * as CT from "./common-types";
import { decrypt } from "./campaigns/campaignId";
import campaigns, { invalidCampaign, testCampaign} from "./campaigns/map";
import { addImpression, mkPool, run_, run, addEvent } from "./analytics/db";
import { UnresolvedCampaignValue, ResolvedCampaignValue } from "./campaigns/types";
import bodyParser from "body-parser";
import { left, Either, right } from "fp-ts/lib/Either";
import { Option, some, none } from "fp-ts/lib/Option";
import * as request from 'request-promise-native'
import cookieParser from 'cookie-parser'

const app = express();
const pool = mkPool(process.env.osui_connection_string);

app.use('/favicon.ico', express.static('assets/favicon.ico'));
app.get('/robots.txt', (_, res) => res.end('User-agent: *\nDisallow: /'))

app.post(
  "/analytics/impression/:encCampaignId",
  bodyParser.json({ type: _ => true }),
  async (req: express.Request, res: express.Response) => {
    const { rockmanId, userId, page, originalUrl } = req.body;
    const campaignId = decrypt(req.params.encCampaignId);
    run_(pool, client =>
      addImpression(
        client,
        "Client",
        rockmanId,
        userId,
        campaignId,
        CT.HandleName.wrap(page),
        CT.Url.wrap(originalUrl),
        CT.IP.wrap(req.headers['x-forwarded-for'] as string || req.ip),
        CT.Country.wrap("xx"),
        R.omit(['connection', 'accept', 'accept-encoding', 'upgrade-insecure-requests'], req.headers),
        req.query
      )
    );
    res.end();
  }
);

app.post(
  "/analytics/event",
  bodyParser.json({ type: _ => true }),
  (req: express.Request, res: express.Response) => {
    const {
      rockmanId,
      category,
      action,
      label,
      value,
      args,
      relt,
      view
    } = req.body;
    run_(pool, client =>
      addEvent(
        client,
        left(CT.RockmanId.wrap(rockmanId)),
        view,
        category,
        action,
        label,
        value,
        args,
        relt
      )
    );

    res.send();
  }
);

app.get("/pixels/", async (req, res) => {
  try {
    const stream = await prepareStatic(CT.HandleName.wrap('online-pixels'), none, req.query.skipCache == 'true');
    stream.pipe(res);
  } catch(ex)  {
    console.error(ex)
    res.status(500);
    res.send({ error: ex.toString() });
  }
})

async function serveCampaign(
  campaign: Option<Either<UnresolvedCampaignValue, ResolvedCampaignValue>>,
  skipCache: boolean,
  req: express.Request,
  res: express.Response
) {
  const oldRockmanId = R.pipe(
    x => !!x ? CT.RockmanId.wrap(x) : null
  )(req.query['rockman_id'] || req.cookies['rockmanId'])
  const no_js_form_submission = req.query["no_js_form_submission"]

  type Impression = {
    rockmanId: CT.NTRockmanId;
    userId: CT.NTUserId;
    impressionNumber: CT.NTImpressionId;
  }

  const recordFormSubmissionEvent = async (oldRockmanId : CT.NTRockmanId, no_js_form_submission: boolean) : Promise<Impression> => {
    if(!oldRockmanId) {
      throw new Error(`oldRockmanId is null inside recordFormSubmissionEvent\nUrl: ${req.originalUrl}`);
    } else {
      run_(pool, client => addEvent(
        client,
        left(oldRockmanId),
        "default",
        "Fraud",
        "form-submitted",
        no_js_form_submission ? 'no-js': 'with-js',
        null,
        {
          url: req.originalUrl,
          ip: req.headers['x-forwarded-for'] as string || req.ip
        },
        null
      ));

      return {
        rockmanId: oldRockmanId,
        userId: CT.userIdFromRockmanId(oldRockmanId), //TODO: read from cookie
        impressionNumber: CT.ImpressionId.wrap(1)
      }
    }
  }

  const recordImpressionEvent = async (cmp: ResolvedCampaignValue) : Promise<Impression> => {
    const rockmanId = CT.RockmanId.wrap(uuid().replace(/-/g, ""));
    const userId = CT.userIdFromRockmanId(req.cookies.userId || rockmanId);
    const impressionNumber = CT.ImpressionNumber.wrap(1);
    const remoteAddress = req.headers['x-forwarded-for'] as string || req.ip

    const {id, page} = cmp
    
    run_(pool, client =>
      addImpression(
        client,
        "Server",
        rockmanId,
        userId,
        id,
        page,
        CT.Url.wrap(req.originalUrl),
        CT.IP.wrap(remoteAddress),
        CT.Country.wrap("xx"),
        R.omit(['connection', 'accept', 'accept-encoding', 'upgrade-insecure-requests'], req.headers),
        req.query
      )
    );

    const bupperizeCountry = c => c == 'gb' ? 'uk' : c

    const ipTokens = R.pipe(
      x => x.split('.')
    , x => ({
        ip2: R.pipe(R.take(2), y => y.join('.'))(x)
      , ip3: R.pipe(R.take(3), y => y.join('.'))(x)
    })
    )(remoteAddress)
    request.default({
      method: 'POST',
      json: true,
      body: {
        rockmanId: CT.RockmanId.unwrap(rockmanId),
        pacmanId: `${CT.RockmanId.unwrap(rockmanId)}-1-${CT.ImpressionNumber.unwrap(impressionNumber)}`,
        impressionId: CT.ImpressionNumber.unwrap(impressionNumber),
        landingPageUrl: 'http://' + req.hostname + req.originalUrl, 
        handleName: CT.HandleName.unwrap(cmp.page),
        pageName: 'default',
        serverTime: new Date().valueOf(),
        eventType: "impression",
        headers: req.headers,
        country: bupperizeCountry(CT.Country.unwrap(cmp.country)),
        offerId: CT.OfferId.unwrap(cmp.affiliateInfo.offerId),
        affId: CT.AffiliateId.unwrap(cmp.affiliateInfo.affiliateId),
        remoteAddress,
        ipTokens,
        queryTokens: req.query
      },
      uri: 'https://de-pacman.sam-media.com/api/v1/store'
    });

    return {rockmanId, userId, impressionNumber}
  }

  campaign.fold(
    async () => {
      try {
        !!no_js_form_submission
          ? recordFormSubmissionEvent(oldRockmanId, "true" == no_js_form_submission)
          : recordImpressionEvent(invalidCampaign);
        res.status(404);
        res.end("Campaign is not valid");
      } catch (ex) {
        console.error(ex)
        res.status(500);
        res.send({ error: ex.toString() });
      }
    },
    (eitherCampaign) => async () => {
      try {
        const campaign = await eitherCampaign.fold(
          async (unResolvedCampaign) => {
            const affiliateInfo = await unResolvedCampaign.affiliateInfo.fold(
              x => Promise.resolve(x),
              x => {
                // free campaigns require offer parameter in their query strings
                const offerId = parseInt(req.query['offer'])
                if (isNaN(offerId)) {
                  throw "`offer` query string parameter is expected";
                } else {
                  return run(pool, client => x(client, CT.OfferId.wrap(offerId)))
                }
              }
            )
            return { ...unResolvedCampaign, affiliateInfo }
          },
          x => Promise.resolve(x)
        )
        const { rockmanId, userId, impressionNumber } = !!no_js_form_submission
          ? await recordFormSubmissionEvent(oldRockmanId, "true" == no_js_form_submission)
          : await recordImpressionEvent(campaign);
        res.cookie('userId', CT.UserId.unwrap(userId), { expires: new Date(new Date().valueOf() + 90 * 24 * 3600 * 1000) })
        res.cookie('rockmanId', CT.RockmanId.unwrap(rockmanId), { expires: new Date(new Date().valueOf() + 3600 * 1000) })
        res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        const stream = await prepare(rockmanId, impressionNumber, campaign, skipCache);
        stream.pipe(res);
      } catch (ex) {
        console.error(ex)
        res.status(500);
        res.send({ error: ex.toString() });
      }
    }
  )();
}

app.get('/preview', cookieParser(), async (req, res) => {
  try {
    serveCampaign(some(right(testCampaign(req.query.page, req.query.country))), true, req, res)
  } catch(ex) {
    console.error(ex)
    res.status(500);
    res.end(ex.toString())
  }
});

app.get(
  "/:encCampaignId",
  cookieParser(),
  async (req: express.Request, res: express.Response) => {
    try {
      const campaignId = decrypt(req.params.encCampaignId);
      //TODO: pass pool itself to campaigns() function
      const campaign = await run(pool, client => campaigns(client, campaignId));
      return serveCampaign(campaign.map(c => left(c)), false, req, res);
    } catch(ex) {
      console.error(ex)
      res.status(500)
      res.send({error: ex.toString()})
    }
  }
);

app.use(
  "/static",
  express.static("../client/dist/static") //, { maxAge: 31557600000 })
);

/*(() => {
  // add express static file handler for each directory in dist/
  const isDirectory = source => fs.lstatSync(source).isDirectory();
  const getDirectories = source =>
    fs
      .readdirSync(source)
      .map(name => path.join(source, name))
      .filter(isDirectory);

  getDirectories(path.join(__dirname, "/../../dist")).map(d => {
    app.use(
      "/" + path.basename(d),
      express.static(d) //, { maxAge: 31557600000 })
    );
  });
})();*/

const port = !!process.env.port ? parseInt(process.env.port) : 3030;
app.listen(port);
console.log("Listening on " + port);
