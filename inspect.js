const { crawl } = require("./crawl");

(async () => {
  const result = await crawl("https://artenda.net/art-open-call-opportunity/competition", {
    javascript: `(function() {
      // Look for list items
      const cards = document.querySelectorAll("[class*=card], [class*=item], [class*=opportunity], [class*=listing], article, .row > div");

      // Look for pagination
      const pagination = document.querySelectorAll("[class*=paginat], [class*=page], a[href*=page], [class*=load-more], [class*=next], [class*=subscribe]");

      // Check for JS frameworks
      const nextData = document.getElementById("__NEXT_DATA__");
      const nuxtData = document.getElementById("__NUXT_DATA__") || document.getElementById("__NUXT__");

      // Check for data in script tags
      const allScripts = Array.from(document.querySelectorAll("script"));
      const dataScripts = allScripts
        .filter(s => s.textContent && (s.textContent.includes("competition") || s.textContent.includes("opportunity") || s.textContent.includes("props") || s.textContent.includes("__data")))
        .map(s => s.textContent.substring(0, 500));

      // Check all links on page
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map(a => ({ text: a.textContent.trim().substring(0, 60), href: a.href }))
        .filter(l => l.href.includes("competition") || l.href.includes("opportunity") || l.href.includes("page") || l.text.includes("more") || l.text.includes("next") || l.text.includes("subscribe"));

      // Check for blurred / paywalled content
      const blurred = document.querySelectorAll("[class*=blur], [class*=paywall], [class*=locked], [class*=premium], [class*=subscribe], [style*=filter]");

      // Get the full body HTML structure outline
      const bodyChildren = Array.from(document.body.children).map(c => ({
        tag: c.tagName,
        class: c.className?.substring?.(0, 100),
        id: c.id,
        childCount: c.children.length
      }));

      return {
        cardCount: cards.length,
        cardClasses: Array.from(new Set(Array.from(cards).map(e => e.className?.substring?.(0, 80)))).slice(0, 15),
        paginationCount: pagination.length,
        paginationElements: Array.from(pagination).map(e => ({
          tag: e.tagName,
          class: e.className?.substring?.(0, 80),
          href: e.href || null,
          text: e.textContent?.trim()?.substring(0, 80)
        })).slice(0, 10),
        hasNextData: !!nextData,
        hasNuxtData: !!nuxtData,
        dataScriptCount: dataScripts.length,
        dataScriptPreviews: dataScripts.slice(0, 3),
        relevantLinks: links.slice(0, 20),
        blurredElements: blurred.length,
        blurredClasses: Array.from(new Set(Array.from(blurred).map(e => e.className?.substring?.(0, 80)))).slice(0, 10),
        bodyStructure: bodyChildren
      };
    })()`
  });

  console.log(JSON.stringify(result.jsResult, null, 2));
})();
