const data = JSON.parse(require("fs").readFileSync("/tmp/artenda-crawl.json", "utf8"));

console.log("=== PAGE TITLE ===");
console.log(data.title);

console.log("\n=== TEXT PREVIEW (first 800 chars) ===");
console.log(data.text?.substring(0, 800));

console.log("\n=== NETWORK REQUESTS SUMMARY ===");
console.log("Total requests:", data.networkRequests.length);
const byType = {};
data.networkRequests.forEach(r => {
  byType[r.resourceType] = (byType[r.resourceType] || 0) + 1;
});
console.log("By type:", JSON.stringify(byType, null, 2));

console.log("\n=== XHR / FETCH / API REQUESTS ===");
data.networkRequests
  .filter(r => r.resourceType === "xhr" || r.resourceType === "fetch" || r.url.includes("api") || r.url.includes("graphql"))
  .forEach(r => console.log(r.method, r.status, r.url.substring(0, 200)));

console.log("\n=== DOCUMENT / XHR / FETCH REQUESTS (full details) ===");
data.networkRequests
  .filter(r => ["xhr", "fetch", "document"].includes(r.resourceType))
  .forEach(r => {
    console.log(`\n--- ${r.method} ${r.status} [${r.resourceType}] ---`);
    console.log("URL:", r.url);
    if (r.responseHeaders?.["content-type"]) {
      console.log("Content-Type:", r.responseHeaders["content-type"]);
    }
    if (r.remoteAddress) {
      console.log("Remote:", r.remoteAddress.ip + ":" + r.remoteAddress.port);
    }
  });
