const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const list = require('./thirdparty-list/list');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors());


app.get('/get3p', async (request, response) => {

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

});




app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT}`);
});

// Make sure node server process stops if we get a terminating signal.
function processTerminator(sig) {
  if (typeof sig === 'string') {
    process.exit(1);
  }
  console.log('%s: Node server stopped.', Date(Date.now()));
}

const signals = [
  'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
  'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];

signals.forEach(sig => {
  process.once(sig, () => processTerminator(sig));
});