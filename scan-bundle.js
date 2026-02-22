const https = require("https");

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scan-bundle.js <js-url>");
  process.exit(1);
}

https.get(url, (res) => {
  let body = "";
  res.on("data", (d) => (body += d));
  res.on("end", () => {
    console.log("JS bundle size:", body.length, "bytes\n");

    const patterns = [
      /["'`](\/api\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/v[0-9]+\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/graphql[^"'`\s]*)["'`]/g,
      /["'`](\/rest\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/data\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/ajax\/[^"'`\s]{2,})["'`]/g,
      /["'`](\/wp-json\/[^"'`\s]{2,})["'`]/g,
      /fetch\s*\(\s*["'`]([^"'`\s]+)["'`]/g,
      /axios\.\w+\s*\(\s*["'`]([^"'`\s]+)["'`]/g,
      /\.ajax\s*\(\s*\{[^}]*url\s*:\s*["'`]([^"'`\s]+)["'`]/g,
      /["'`](https?:\/\/[^"'`\s]*\/api\/[^"'`\s]+)["'`]/g,
      /["'`]([^"'`\s]*\.json(\?[^"'`\s]*)?)["'`]/g,
      /url\s*:\s*["'`](\/[^"'`\s]+)["'`]/g,
      /action\s*:\s*["'`](\/[^"'`\s]+)["'`]/g,
      /\.post\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
      /\.get\s*\(\s*["'`](\/[^"'`\s]+)["'`]/g,
    ];

    const found = new Set();
    for (const p of patterns) {
      p.lastIndex = 0;
      let m;
      while ((m = p.exec(body)) !== null) {
        const ep = m[1];
        if (!/\.(css|png|jpg|gif|svg|woff|ttf|ico|eot)$/i.test(ep)) {
          found.add(ep);
        }
      }
    }

    console.log("Endpoints/URLs found in JS bundle:");
    if (found.size === 0) {
      console.log("  (none found)");
    } else {
      Array.from(found)
        .sort()
        .forEach((e) => console.log(" ", e));
    }
  });
});
