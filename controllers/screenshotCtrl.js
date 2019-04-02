const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const phone = devices['Nexus 5X'];

exports.takeScreenshot = async (request,response) => {

  const url = request.query.url;
  if (!url) {
    return response.status(400).send(
      'Please provide a URL. Example: ?url=https://example.com');
  }

  // Default to a reasonably large viewport for full page screenshots.
  const viewport = {
    width: 1280,
    height: 1024,
    deviceScaleFactor: 2
  };

  let fullPage = true;
  const size = request.query.size;
  if (size) {
    const [width, height] = size.split(',').map(item => Number(item));
    if (!(isFinite(width) && isFinite(height))) {
      return response.status(400).send(
        'Malformed size parameter. Example: ?size=800,600');
    }
    viewport.width = width;
    viewport.height = height;

    fullPage = false;
  }

  const browser = await puppeteer.launch({
    dumpio: true,
    // headless: false,
    // executablePath: 'google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // , '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.emulate(phone);
    await page.goto(url, {
      waitUntil: 'networkidle0'
    });

    const opts = {
      fullPage,
      // omitBackground: true
      type:"jpeg", quality: 60
    };

    if (!fullPage) {
      opts.clip = {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height
      };
    }

    let buffer;

    const element = request.query.element;
    if (element) {
      const elementHandle = await page.$(element);
      if (!elementHandle) {
        return response.status(404).send(
          `Element ${element} not found`);
      }
      buffer = await elementHandle.screenshot();
    } else {
      buffer = await page.screenshot(opts);
    }
    response.type('image/png').send(buffer);
  } catch (err) {
    response.status(500).send(err.toString());
  }

  await browser.close();

}