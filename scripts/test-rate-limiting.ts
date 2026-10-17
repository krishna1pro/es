/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from "http";
import app from "../src/serverApp";

async function testRateLimit() {
  const server = http.createServer(app);
  const PORT = 3057;
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  const baseUrl = `http://127.0.0.1:${PORT}`;

  console.log("Testing submission rate limiting (max 10 requests / 15 min)...");
  let triggered429 = false;

  for (let i = 1; i <= 12; i++) {
    const res = await fetch(`${baseUrl}/api/public/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Rate Limit Test" }) // Missing fields -> normally 400 until limit hit
    });

    if (res.status === 429) {
      const body = await res.json();
      console.log(`✅ Attempt ${i}: Rate limit triggered successfully! HTTP 429 ->`, body.error);
      triggered429 = true;
      break;
    }
  }

  server.close();

  if (!triggered429) {
    console.error("❌ Rate limiter did not trigger HTTP 429 after 10 requests");
    process.exit(1);
  }
}

testRateLimit().catch((err) => {
  console.error("Rate limit test failed:", err);
  process.exit(1);
});
