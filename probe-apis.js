const https = require("https");

const BASE = "https://artenda.net";

const endpoints = [
  { path: "/api/country-by-id", method: "GET", params: "?id=1" },
  { path: "/api/country-by-id", method: "GET", params: "" },
  { path: "/api/tender-details/", method: "GET", params: "1" },
  { path: "/api/tender-details/", method: "GET", params: "" },
  { path: "/api/email-recommendation", method: "GET", params: "" },
  { path: "/api/email-recommendation-days", method: "GET", params: "" },
  { path: "/api/email-reminder-days", method: "GET", params: "" },
  { path: "/api/remember-filter", method: "GET", params: "" },
  { path: "/api/watchlist-add", method: "GET", params: "" },
  { path: "/api/watchlist-remove", method: "GET", params: "" },
  { path: "/api/set-vat-id-reminder", method: "GET", params: "" },
  // Guess some common listing endpoints
  { path: "/api/tenders", method: "GET", params: "" },
  { path: "/api/competitions", method: "GET", params: "" },
  { path: "/api/opportunities", method: "GET", params: "" },
  { path: "/api/listings", method: "GET", params: "" },
  { path: "/api/search", method: "GET", params: "" },
  { path: "/api/tender-details/", method: "GET", params: "2" },
  { path: "/api/tender-details/", method: "GET", params: "10" },
  { path: "/api/tender-details/", method: "GET", params: "100" },
];

function probe(endpoint) {
  return new Promise((resolve) => {
    const url = BASE + endpoint.path + endpoint.params;
    const req = https.request(url, { method: endpoint.method }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers["content-type"] || "",
          bodyLength: body.length,
          bodyPreview: body.substring(0, 300),
        });
      });
    });
    req.on("error", (e) => resolve({ url, error: e.message }));
    req.end();
  });
}

(async () => {
  const results = await Promise.all(endpoints.map(probe));
  for (const r of results) {
    const status = r.status || "ERR";
    const icon = status === 200 ? "OK" : status === 302 ? "REDIRECT" : status;
    console.log(`\n[${icon}] ${r.url}`);
    if (r.contentType) console.log("  Type:", r.contentType);
    if (r.bodyLength) console.log("  Size:", r.bodyLength, "bytes");
    if (r.bodyPreview) console.log("  Body:", r.bodyPreview.replace(/\n/g, " ").substring(0, 200));
    if (r.error) console.log("  Error:", r.error);
  }
})();
