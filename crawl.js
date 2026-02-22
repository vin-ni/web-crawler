const puppeteer = require("puppeteer");

async function crawl(url, options = {}) {
  const {
    waitFor = "networkidle2",
    timeout = 30000,
    screenshot = null,
    extractLinks = false,
    extractText = false,
    extractNetworkRequests = false,
    waitForSelector = null,
    javascript = null,
    headers = {},
    viewport = { width: 1280, height: 800 },
  } = options;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  if (Object.keys(headers).length > 0) {
    await page.setExtraHTTPHeaders(headers);
  }

  // Network request logging
  const networkRequests = [];
  if (extractNetworkRequests) {
    page.on("request", (req) => {
      networkRequests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        headers: req.headers(),
      });
    });

    page.on("response", (res) => {
      const entry = networkRequests.find(
        (r) => r.url === res.url() && !r.status
      );
      if (entry) {
        entry.status = res.status();
        entry.responseHeaders = res.headers();
        entry.remoteAddress = res.remoteAddress();
      }
    });
  }

  try {
    await page.goto(url, { waitUntil: waitFor, timeout });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    }

    const result = {
      url: page.url(),
      title: await page.title(),
    };

    if (extractText) {
      result.text = await page.evaluate(() => document.body.innerText);
    }

    if (extractLinks) {
      result.links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]")).map((a) => ({
          text: a.innerText.trim(),
          href: a.href,
        }))
      );
    }

    if (extractNetworkRequests) {
      result.networkRequests = networkRequests;
    }

    if (screenshot) {
      await page.screenshot({ path: screenshot, fullPage: true });
      result.screenshotPath = screenshot;
    }

    if (javascript) {
      result.jsResult = await page.evaluate(javascript);
    }

    await browser.close();
    return result;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

// CLI mode: node crawl.js <url> [options-as-json]
if (require.main === module) {
  const url = process.argv[2];
  const opts = process.argv[3] ? JSON.parse(process.argv[3]) : {};

  if (!url) {
    console.error("Usage: node crawl.js <url> [options-json]");
    process.exit(1);
  }

  crawl(url, opts)
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((err) => {
      console.error("Error:", err.message);
      process.exit(1);
    });
}

module.exports = { crawl };
