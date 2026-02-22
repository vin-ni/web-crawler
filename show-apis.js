const data = JSON.parse(require("fs").readFileSync("/tmp/artenda-api.json", "utf8"));
const api = data.apiDiscovery;

console.log("=== API DISCOVERY SUMMARY ===");
console.log(JSON.stringify(api.summary, null, 2));

console.log("\n=== API CALLS IN NETWORK TRAFFIC ===");
if (api.networkApis.length === 0) {
  console.log("(none found)");
} else {
  api.networkApis.forEach((a, i) => {
    console.log(`\n--- ${i + 1}. ${a.method} ${a.status} ---`);
    console.log("URL:", a.url);
    console.log("MIME:", a.mimeType);
    if (a.postData) console.log("POST data:", a.postData.substring(0, 200));
    if (a.bodyPreview) console.log("Response preview:", a.bodyPreview);
  });
}

console.log("\n=== ENDPOINTS FOUND IN JS SOURCE ===");
if (api.jsEndpoints.length === 0) {
  console.log("(none found)");
} else {
  api.jsEndpoints.forEach((e) => console.log(" ", e));
}

console.log("\n=== JS FILES LOADED ===");
api.jsFiles.forEach((f) => console.log(" ", f));
