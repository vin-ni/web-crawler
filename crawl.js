const puppeteer = require("puppeteer");

async function crawl(url, options = {}) {
  const {
    waitFor = "networkidle2",
    timeout = 30000,
    screenshot = null,
    extractLinks = false,
    extractText = false,
    extractNetworkRequests = false,
    captureResponseBodies = false,
    discoverApis = false,
    waitForSelector = null,
    javascript = null,
    scroll = false,
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
  const responseBodies = {};

  if (extractNetworkRequests || captureResponseBodies || discoverApis) {
    // Use CDP for response body capture
    const cdp = await page.createCDPSession();
    await cdp.send("Network.enable");

    const requestMap = new Map();

    cdp.on("Network.requestWillBeSent", (event) => {
      const { requestId, request, type } = event;
      requestMap.set(requestId, {
        url: request.url,
        method: request.method,
        resourceType: (type || "unknown").toLowerCase(),
        requestHeaders: request.headers,
        postData: request.postData || null,
      });
    });

    cdp.on("Network.responseReceived", (event) => {
      const { requestId, response } = event;
      const entry = requestMap.get(requestId);
      if (entry) {
        entry.status = response.status;
        entry.responseHeaders = response.headers;
        entry.mimeType = response.mimeType;
        entry.remoteAddress = {
          ip: response.remoteIPAddress,
          port: response.remotePort,
        };
      }
    });

    cdp.on("Network.loadingFinished", async (event) => {
      const { requestId } = event;
      const entry = requestMap.get(requestId);
      if (!entry) return;

      // Capture response body for API-like requests
      const shouldCapture =
        captureResponseBodies || discoverApis
          ? isApiLike(entry)
          : false;

      if (shouldCapture) {
        try {
          const { body, base64Encoded } = await cdp.send(
            "Network.getResponseBody",
            { requestId }
          );
          entry.responseBody = base64Encoded
            ? Buffer.from(body, "base64").toString("utf-8")
            : body;
        } catch (_) {
          // Body not available (e.g. redirects)
        }
      }

      networkRequests.push(entry);
    });

    // Also capture requests that fail
    cdp.on("Network.loadingFailed", (event) => {
      const entry = requestMap.get(event.requestId);
      if (entry) {
        entry.failed = true;
        entry.errorText = event.errorText;
        networkRequests.push(entry);
      }
    });
  }

  try {
    await page.goto(url, { waitUntil: waitFor, timeout });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    }

    // Scroll to trigger lazy-loaded content
    if (scroll) {
      await autoScroll(page);
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

    if (extractNetworkRequests || captureResponseBodies) {
      result.networkRequests = networkRequests;
    }

    // API discovery mode
    if (discoverApis) {
      result.apiDiscovery = await discoverApiEndpoints(page, networkRequests);
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

// Detect if a request looks like an API call
function isApiLike(entry) {
  const url = entry.url || "";
  const mime = (entry.mimeType || "").toLowerCase();
  const type = entry.resourceType || "";

  // Skip static assets
  if (["image", "font", "stylesheet", "media"].includes(type)) return false;

  // JSON or XML responses
  if (mime.includes("json") || mime.includes("xml") || mime.includes("graphql"))
    return true;

  // URL patterns that suggest APIs
  if (
    /\/(api|graphql|rest|v[0-9]|data|ajax|rpc|_next\/data)\b/i.test(url) ||
    /\.(json|xml)(\?|$)/i.test(url)
  )
    return true;

  // XHR / fetch
  if (type === "xhr" || type === "fetch") return true;

  return false;
}

// Scan JS source files for endpoint patterns
async function discoverApiEndpoints(page, networkRequests) {
  // 1. Endpoints found in network traffic
  const networkApis = networkRequests
    .filter((r) => isApiLike(r))
    .map((r) => ({
      url: r.url,
      method: r.method,
      status: r.status,
      mimeType: r.mimeType,
      hasBody: !!r.responseBody,
      bodyPreview: r.responseBody
        ? r.responseBody.substring(0, 500)
        : null,
      postData: r.postData || null,
    }));

  // 2. Scan inline and external JS for endpoint patterns
  const jsEndpoints = await page.evaluate(() => {
    const patterns = [
      // URL path patterns
      /["'`](\/api\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/v[0-9]+\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/graphql[^"'`\s]*)["'`]/g,
      /["'`](\/rest\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/data\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/ajax\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/rpc\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/wp-json\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/_next\/data\/[^"'`\s]{2,})["'`]/g,
      // Full URL patterns
      /["'`](https?:\/\/[^"'`\s]*\/api\/[^"'`\s]{2,})["'`]/g,
      /["'`](https?:\/\/[^"'`\s]*\.json[^"'`\s]*)["'`]/g,
      // fetch/axios/XMLHttpRequest patterns
      /fetch\s*\(\s*["'`]([^"'`\s]+)["'`]/g,
      /axios\.\w+\s*\(\s*["'`]([^"'`\s]+)["'`]/g,
      /\.open\s*\(\s*["'`]\w+["'`]\s*,\s*["'`]([^"'`\s]+)["'`]/g,
      /\.get\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
      /\.post\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
      /\.put\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
      /\.delete\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
    ];

    const found = new Set();

    // Scan all script tags (inline + loaded)
    const scripts = document.querySelectorAll("script");
    scripts.forEach((script) => {
      const text = script.textContent || "";
      if (!text) return;
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          found.add(match[1]);
        }
      }
    });

    return Array.from(found);
  });

  // 3. Scan external JS file URLs for potential API hosts
  const jsFiles = networkRequests
    .filter((r) => r.resourceType === "script" && r.url)
    .map((r) => r.url);

  return {
    networkApis,
    jsEndpoints,
    jsFiles,
    summary: {
      apiCallsFound: networkApis.length,
      endpointsInJs: jsEndpoints.length,
      jsFilesLoaded: jsFiles.length,
    },
  };
}

// Auto-scroll to trigger lazy loading
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
      // Safety timeout
      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 10000);
    });
  });
  // Wait for any triggered network requests to settle
  await new Promise((r) => setTimeout(r, 2000));
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
