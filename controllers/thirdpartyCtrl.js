const list = require('../thirdparty-list/list');
const puppeteer = require('puppeteer');

exports.get3p = async (request, response) => {

    const url = request.query.url;

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

        await page.goto(url, {
            waitUntil: 'networkidle0'
        });

        console.log(`[Pupeeteer] Opened ${url}`);

        await page.waitFor(2000);


        const thirdPartyScripts = await page.evaluate(() => {

            const domainList = new Set();

            [...document.querySelectorAll('script')]
            .filter(e => !e.src.includes(document.location.hostname) && e.src !== "")
                .map(e => domainList.add(new URL(e.src).host));

            return [...domainList];

        });


        console.log(`[Pupeeteer] Finished  ${url}`);

        const thirdPartyScriptsClassified = list.classifyThirdParties(thirdPartyScripts);

        response.json(thirdPartyScriptsClassified);


    } catch (err) {
        response.status(500).send(err.toString());
    }

    await browser.close();


};