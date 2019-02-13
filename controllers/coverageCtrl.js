const puppeteer = require('puppeteer');
const list = require('../thirdparty-list/list');
const URL = require('url');

class coverageRunner {

    constructor(
        url,
        EVENTS = [
            'domcontentloaded',
            'load',
        ]) {

        this.url = url;
        this.stats = new Map();
        this.EVENTS = EVENTS;
    }


    /**
     * addUsage
     * 
     * @param {!Object} coverage
     * @param {string} type Either "css" or "js" to indicate which type of coverage.
     * @param {string} eventType The page event when the coverage was captured.
     */
    addUsage(coverage, type, eventType) {

        for (const entry of coverage) {
            if (!this.stats.has(entry.url)) {
                this.stats.set(entry.url, []);
            }

            const urlStats = this.stats.get(entry.url);

            let eventStats = urlStats.find(item => item.eventType === eventType);
            if (!eventStats) {
                eventStats = {
                    cssUsed: 0,
                    jsUsed: 0,
                    get usedBytes() {
                        return this.cssUsed + this.jsUsed;
                    },
                    totalBytes: 0,
                    get percentUsed() {
                        return this.totalBytes ? Math.round(this.usedBytes / this.totalBytes * 100) : 0;
                    },
                    eventType,
                    url: entry.url,
                };
                urlStats.push(eventStats);
            }

            eventStats.totalBytes += entry.text.length;

            for (const range of entry.ranges) {
                eventStats[`${type}Used`] += range.end - range.start - 1;
            }
        }
    }



    /**
     * collectCoverage
     * 
     * @param {string} URL 
     */
    async collectCoverage(URL) {

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // , '--disable-dev-shm-usage']
            headless: true
        });

        console.log("[codeCoverage] pupetteer started...");

        // Do separate load for each event. See
        // https://github.com/GoogleChrome/puppeteer/issues/1887
        const collectPromises = this.EVENTS.map(async event => {

            const page = await browser.newPage();

            await Promise.all([
                page.coverage.startJSCoverage(),
                page.coverage.startCSSCoverage()
            ]);

            await page.goto(URL, {
                waitUntil: event
            });

            await page.waitFor(5000);
            // await page.waitForNavigation({waitUntil: event});

            const [jsCoverage, cssCoverage] = await Promise.all([
                page.coverage.stopJSCoverage(),
                page.coverage.stopCSSCoverage()
            ]);

            this.addUsage(cssCoverage, 'css', event);
            this.addUsage(jsCoverage, 'js', event);

            await page.close();
        });

        await Promise.all(collectPromises);

        return browser.close();
    }



    /**
     * 
     * 
     * @param {string} URL 
     */
    async collectCoverageFromPupetter(URL = this.url) {

        return new Promise(async (resolve, reject) => {

            try {

                let data = {
                    summary: {},
                    urls: []
                };


                await this.collectCoverage(URL);

                for (const [url, vals] of this.stats) {

                    this.EVENTS.forEach(event => {
                        const usageForEvent = vals.filter(val => val.eventType === event);

                        if (usageForEvent.length) {
                            for (const stats of usageForEvent) {

                                const formatter = new UsageFormatter(stats);
                                formatter.stats.summary = formatter.summary();
                                data.urls.push(formatter.stats);

                            }
                        }

                    });


                }

                // Print total usage for each event.
                this.EVENTS.forEach(event => {

                    let totalBytes = 0;
                    let totalUsedBytes = 0;

                    const metrics = Array.from(this.stats.values());
                    const statsForEvent = metrics.map(eventStatsForUrl => {
                        const statsForEvent = eventStatsForUrl.filter(stat => stat.eventType === event)[0];
                        // TODO: need to sum max totalBytes. Currently ignores stats if event didn't
                        // have an entry. IOW, all total numerators should be max totalBytes seen for that event.
                        if (statsForEvent) {
                            totalBytes += statsForEvent.totalBytes;
                            totalUsedBytes += statsForEvent.usedBytes;
                        }
                    });

                    const percentUsed = Math.round(totalUsedBytes / totalBytes * 100);

                    // create summary
                    data.summary[event] = {}
                    data.summary[event].percentUsed = percentUsed;
                    data.summary[event].totalUsedBytes = formatBytesToKB(totalUsedBytes);
                    data.summary[event].totalBytes = formatBytesToKB(totalBytes);


                });

                return resolve(data);


            } catch (error) {

                return reject(`Something went wrong ${error}`);

            }


        });
    }

}


function formatBytesToKB(bytes) {
    if (bytes > 1024) {
        const formattedNum = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 1
        }).format(bytes / 1024);
        return `${formattedNum}KB`;
    }
    return `${bytes} bytes`;
}


/**
 * UsageFormatter
 * 
 * Format the data 
 */
class UsageFormatter {

    constructor(stats) {
        this.stats = stats;
    }

    summary(used = this.stats.usedBytes, total = this.stats.totalBytes) {
        const percent = Math.round((used / total) * 100);
        return `${formatBytesToKB(used)}/${formatBytesToKB(total)} (${percent}%)`;
    }

    shortSummary(used, total = this.stats.totalBytes) {
        const percent = Math.round((used / total) * 100);
        return used ? `${formatBytesToKB(used)} (${percent}%)` : 0;
    }


}



/**
 * 
 * @param {object} coverage 
 * @param {string} mainURL 
 */
const identifyThirdParty = (coverage, mainURL) => {

    const mainHost = URL.parse(mainURL).host;

    coverage.urls = coverage.urls.map(c => {

        const host = URL.parse(c.url).host;

        c.isExternal = (host === mainHost) ? false : true;

        c.isThirdParty = list.isThirdPartyURL(host);

        return c;
    });

    return coverage;

}


/**
 * readTheCoverage
 * 
 * @param {object} coverage 
 * @param {string} event 
 * @param {string} type 
 * @param {boolean} filter3P 
 */
const readTheCoverage = (coverage, event, type = "js", filter3P = false) => {


    let final = coverage.urls.filter(c => c.eventType === event);

    // for JavaScript 
    if (type === "js") {

        final = final.filter(c => c.jsUsed > 0 && c.cssUsed === 0);

        if (filter3P) final = final.filter(c => !c.isThirdParty);

    }

    // for CSS
    if (type === "css") final = final.filter(c => c.cssUsed > 0 && c.jsUsed === 0);


    let urlTotalBytes = final.reduce((initial, url) => initial + url.totalBytes, initial = 0);
    let urlUsedBytes = final.reduce((initial, url) => initial + url.usedBytes, initial = 0);


    return {
        event,
        filter3P,
        percentageUsed: Math.round(urlUsedBytes / urlTotalBytes * 100),
        percentageUnused: 100 - Math.round(urlUsedBytes / urlTotalBytes * 100),
        totalBytes: urlTotalBytes
    }


}



exports.sendCoverage = async (req, res) => {


    console.log(`[codeCoverage] Request... ${req.query.url}`)


    const coverageData = new coverageRunner(req.query.url);


    let coverage = await coverageData.collectCoverageFromPupetter()
        .catch(e => res.status(500).send(`Something went wrong ${e}`));

    coverage = identifyThirdParty(coverage, req.query.url);

    res.json({
        js: readTheCoverage(coverage, 'load', 'js', req.query.filter3p),
        css: readTheCoverage(coverage, 'load', 'css'),
        coverage
    });


};