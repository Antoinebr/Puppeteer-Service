const puppeteer = require('puppeteer');

exports.getCoverage = async (req, res) => {

    const URL = req.query.url;

    const EVENTS = [
        'domcontentloaded',
        'load',
        // 'networkidle2',
        'networkidle0',
    ];

    function formatBytesToKB(bytes) {
        if (bytes > 1024) {
            const formattedNum = new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 1
            }).format(bytes / 1024);
            return `${formattedNum}KB`;
        }
        return `${bytes} bytes`;
    }

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

    const stats = new Map();

    /**
     * @param {!Object} coverage
     * @param {string} type Either "css" or "js" to indicate which type of coverage.
     * @param {string} eventType The page event when the coverage was captured.
     */
    function addUsage(coverage, type, eventType) {

        for (const entry of coverage) {
            if (!stats.has(entry.url)) {
                stats.set(entry.url, []);
            }

            const urlStats = stats.get(entry.url);

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

    async function collectCoverage() {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // , '--disable-dev-shm-usage']
            headless: true
        });

        // Do separate load for each event. See
        // https://github.com/GoogleChrome/puppeteer/issues/1887
        const collectPromises = EVENTS.map(async event => {

            const page = await browser.newPage();

            await Promise.all([
                page.coverage.startJSCoverage(),
                page.coverage.startCSSCoverage()
            ]);

            await page.goto(URL, {
                waitUntil: event
            });
            // await page.waitForNavigation({waitUntil: event});

            const [jsCoverage, cssCoverage] = await Promise.all([
                page.coverage.stopJSCoverage(),
                page.coverage.stopCSSCoverage()
            ]);

            addUsage(cssCoverage, 'css', event);
            addUsage(jsCoverage, 'js', event);

            await page.close();
        });

        await Promise.all(collectPromises);

        return browser.close();
    }

    (async () => {


        let data = {
            summary: {},
            urls: []
        };


        await collectCoverage();

        for (const [url, vals] of stats) {

            EVENTS.forEach(event => {
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
        EVENTS.forEach(event => {

            let totalBytes = 0;
            let totalUsedBytes = 0;

            const metrics = Array.from(stats.values());
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

        //console.log(JSON.stringify(data))

        return res.json(data);

    })()
    .catch(e => {

        return res.status(500).send(`Something went wrong ${e}`);
    })


};