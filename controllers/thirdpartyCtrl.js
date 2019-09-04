const list = require('../thirdparty-list/list');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const URL = require('url');
const {
    dumpError
} = require('../utils/error');

exports.get3p = async (request, response) => {

    const url = request.query.url;
    const crawlAsMobile = request.query.set_mobile_ua;

    if (!url) return response.status(400).send('Please provide a URL. Example: ?url=https://example.com');

    const browser = await puppeteer.launch({
        dumpio: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // , '--disable-dev-shm-usage']
    });

    if (request.query.mocked) {

        return response.json({
            "shouldBeBlocked": [
                "netmng.com",
                "googleadservices.com",
                "google-analytics.com",
                "googletagmanager.com",
                "facebook.net",
                "youtube.com"
            ],
            "shouldntBeBlocked": [
                "sc-static.net",
                "ytimg.com",
                "yimg.com",
                "googleapis.com",
                "cdn-jaguarlandrover.com"
            ]
        });

    }

    try {

        const page = await browser.newPage();
        
        if(typeof(crawlAsMobile) != 'undefined' && crawlAsMobile === 'true') {
          let uaString = devices['Nexus 5'].userAgent;
          await page.setUserAgent(uaString);
        }

        await page.goto(url, {
            waitUntil: 'load',
            timeout : 90000
        });


        if (process.env.DEBUG) {
            console.log(`[Pupeeteer] Opened dd ${url}`);
        }


        await page.waitFor(2000);


        const thirdPartyScripts = await page.evaluate(() => {

            const domainList = new Set();

            [...document.querySelectorAll('script')]
            .filter(e => !e.src.includes(document.location.hostname) && e.src !== "")
                .map(e => domainList.add(e.src));

            return [...domainList];

        });


        const thirdPartyHosts = thirdPartyScripts.map(e => URL.parse(e).host);

        if (process.env.DEBUG) {

            console.log(thirdPartyHosts);
            console.log(`[Pupeeteer] Finished  ${url}`);

        }

        const thirdPartyScriptsClassified = list.classifyThirdParties(thirdPartyHosts);

        response.json(thirdPartyScriptsClassified);


    } catch (err) {

        if (process.env.DEBUG) {
            console.log(dumpError(err))
        }

        response.status(500).send(err.toString());
    }

    await browser.close();


};
