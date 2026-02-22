# web-finder

A Puppeteer-based web crawling toolkit for networking analysis and API discovery.

## How to crawl websites

Use `crawl.js` via the Bash tool:

```bash
# Basic page load (title + final URL)
node crawl.js "https://example.com"

# Extract all text content
node crawl.js "https://example.com" '{"extractText": true}'

# Extract all links
node crawl.js "https://example.com" '{"extractLinks": true}'

# Capture network requests with full CDP-level detail
node crawl.js "https://example.com" '{"extractNetworkRequests": true}'

# Capture network requests + response bodies for API-like requests
node crawl.js "https://example.com" '{"captureResponseBodies": true}'

# API discovery: find API endpoints in network traffic + scan JS source for endpoint patterns
node crawl.js "https://example.com" '{"discoverApis": true}'

# API discovery + scroll to trigger lazy-loaded API calls
node crawl.js "https://example.com" '{"discoverApis": true, "scroll": true}'

# Take a screenshot
node crawl.js "https://example.com" '{"screenshot": "page.png"}'

# Run custom JavaScript in the page context
node crawl.js "https://example.com" '{"javascript": "document.querySelectorAll(\"img\").length"}'

# Combine options
node crawl.js "https://example.com" '{"discoverApis": true, "scroll": true, "extractText": true, "screenshot": "page.png"}'
```

## Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `extractText` | bool | false | Get page body text |
| `extractLinks` | bool | false | Get all `<a>` links (text + href) |
| `extractNetworkRequests` | bool | false | Log all HTTP requests/responses via CDP (headers, status, remote IP, post data) |
| `captureResponseBodies` | bool | false | Also capture response bodies for API-like requests (JSON, XHR, fetch) |
| `discoverApis` | bool | false | Full API discovery: network API calls with body previews + JS source scanning for endpoint patterns |
| `scroll` | bool | false | Auto-scroll page to trigger lazy-loaded content and API calls |
| `screenshot` | string | null | File path to save a full-page screenshot |
| `javascript` | string | null | JS to evaluate in the page context |
| `waitFor` | string | "networkidle2" | Puppeteer waitUntil value |
| `waitForSelector` | string | null | CSS selector to wait for before extraction |
| `timeout` | number | 30000 | Navigation timeout (ms) |
| `headers` | object | {} | Extra HTTP headers to send |
| `viewport` | object | 1280x800 | Browser viewport dimensions |

## API discovery details

When `discoverApis: true` is set, the output includes an `apiDiscovery` object with:

- **networkApis**: API-like requests captured during page load (JSON, XHR, fetch, graphql) with response body previews
- **jsEndpoints**: URL patterns found by scanning inline JS for fetch(), axios, /api/, /v1/, etc.
- **jsFiles**: External JS files loaded by the page (can be fetched separately for deeper scanning)
- **summary**: Counts of each category
