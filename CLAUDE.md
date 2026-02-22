# web-finder

A Puppeteer-based web crawling toolkit for networking analysis.

## How to crawl websites

Use `crawl.js` via the Bash tool:

```bash
# Basic page load (title + final URL)
node crawl.js "https://example.com"

# Extract all text content
node crawl.js "https://example.com" '{"extractText": true}'

# Extract all links
node crawl.js "https://example.com" '{"extractLinks": true}'

# Capture network requests (URLs, methods, status codes, headers, remote addresses)
node crawl.js "https://example.com" '{"extractNetworkRequests": true}'

# Take a screenshot
node crawl.js "https://example.com" '{"screenshot": "page.png"}'

# Run custom JavaScript in the page context
node crawl.js "https://example.com" '{"javascript": "document.querySelectorAll(\"img\").length"}'

# Combine options
node crawl.js "https://example.com" '{"extractText": true, "extractLinks": true, "extractNetworkRequests": true}'
```

## Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `extractText` | bool | false | Get page body text |
| `extractLinks` | bool | false | Get all `<a>` links (text + href) |
| `extractNetworkRequests` | bool | false | Log all HTTP requests/responses with headers, status, remote IP |
| `screenshot` | string | null | File path to save a full-page screenshot |
| `javascript` | string | null | JS to evaluate in the page context |
| `waitFor` | string | "networkidle2" | Puppeteer waitUntil value |
| `waitForSelector` | string | null | CSS selector to wait for before extraction |
| `timeout` | number | 30000 | Navigation timeout (ms) |
| `headers` | object | {} | Extra HTTP headers to send |
| `viewport` | object | 1280x800 | Browser viewport dimensions |
