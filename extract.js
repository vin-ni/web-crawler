const { crawl } = require("./crawl");

(async () => {
  const result = await crawl("https://artenda.net/art-open-call-opportunity/competition", {
    javascript: `(function() {
      // Get all visible (non-blurred) competition rows
      const allRows = document.querySelectorAll(".row");
      const blurredRows = document.querySelectorAll(".row.blurry");
      const visibleEntries = [];
      const blurredEntries = [];

      // Try to extract competition entries from the main listing
      const wrapper = document.querySelector(".wrapper");

      // Find competition items - look for deadline + title pattern
      const deadlineCols = document.querySelectorAll(".deadline");

      deadlineCols.forEach(d => {
        const row = d.closest(".row");
        if (!row) return;
        const isBlurred = row.classList.contains("blurry");
        const info = row.querySelector(".information");
        const reward = row.querySelector(".reward");
        const location = row.querySelector(".location");

        const entry = {
          deadline: d.textContent.trim().replace(/\\s+/g, " "),
          title: info?.querySelector("h2, h3, strong, b")?.textContent?.trim() || info?.textContent?.trim()?.substring(0, 100),
          reward: reward?.textContent?.trim()?.replace(/\\s+/g, " ")?.substring(0, 100),
          location: location?.textContent?.trim()?.replace(/\\s+/g, " ")?.substring(0, 100),
          blurred: isBlurred
        };

        if (isBlurred) blurredEntries.push(entry);
        else visibleEntries.push(entry);
      });

      // Also check the subscribe/paywall prompt text
      const subscribeText = document.querySelector(".blurry-hint-wrapper")?.textContent?.trim()?.substring(0, 300);

      return {
        totalEntries: visibleEntries.length + blurredEntries.length,
        visibleCount: visibleEntries.length,
        blurredCount: blurredEntries.length,
        visibleEntries: visibleEntries,
        blurredEntries: blurredEntries.slice(0, 5),
        subscribePrompt: subscribeText
      };
    })()`
  });

  const data = result.jsResult;
  console.log(`Total entries on page: ${data.totalEntries}`);
  console.log(`  Visible (free): ${data.visibleCount}`);
  console.log(`  Blurred (paywalled): ${data.blurredCount}`);
  console.log(`\n=== SUBSCRIBE PROMPT ===`);
  console.log(data.subscribePrompt);
  console.log(`\n=== VISIBLE ENTRIES ===`);
  data.visibleEntries.forEach((e, i) => {
    console.log(`\n${i + 1}. ${e.title}`);
    console.log(`   Deadline: ${e.deadline}`);
    console.log(`   Reward: ${e.reward}`);
    console.log(`   Location: ${e.location}`);
  });
  console.log(`\n=== BLURRED ENTRIES (first 5) ===`);
  data.blurredEntries.forEach((e, i) => {
    console.log(`\n${i + 1}. ${e.title}`);
    console.log(`   Deadline: ${e.deadline}`);
  });
})();
