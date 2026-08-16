/**
 * Captures iron swing reference frames from YouTube slow-motion videos
 * and uploads them to the Railway admin API.
 *
 * Usage:
 *   ADMIN_SECRET=xxx node scripts/seed-reference-frames.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const RAILWAY_URL =
  process.env.RAILWAY_URL ||
  "https://golfswing-compare-production.up.railway.app";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("❌  Set ADMIN_SECRET env var (must match Railway ADMIN_SECRET)");
  process.exit(1);
}

// Bryson DeChambeau — QyIG8LPBq_w: "Bryson Dechambeau Golf Swing in Super Slow Motion, face on"
// 56s slow-motion iron swing, face-on angle.
const BRYSON_VIDEO = "https://www.youtube.com/watch?v=QyIG8LPBq_w";
const BRYSON_SLUG = "bryson-dechambeau";
const BRYSON_PHASES = [
  { phase: "ADDRESS",              seekTo: 10,   note: "QyIG8LPBq_w @ ~10s" },
  { phase: "TAKEAWAY",             seekTo: 13,   note: "QyIG8LPBq_w @ ~13s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 19,   note: "QyIG8LPBq_w @ ~19s" },
  { phase: "DOWNSWING_TRANSITION", seekTo: 24,   note: "QyIG8LPBq_w @ ~24s" },
  { phase: "IMPACT",               seekTo: 31,   note: "QyIG8LPBq_w @ ~31s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 41,   note: "QyIG8LPBq_w @ ~41s" },
];

// Grant Horvat — D3fcCpKHQEM: "Grant Horvat Slow Motion Golf Iron Swing!"
// 14s slow-motion short, 3/4 front view progressing to back-on at follow-through.
const GRANT_VIDEO = "https://www.youtube.com/watch?v=D3fcCpKHQEM";
const GRANT_SLUG = "grant-horvat";
const GRANT_PHASES = [
  { phase: "ADDRESS",              seekTo: 0.8,  note: "D3fcCpKHQEM @ ~0.8s" },
  { phase: "TAKEAWAY",             seekTo: 1.8,  note: "D3fcCpKHQEM @ ~1.8s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 4.3,  note: "D3fcCpKHQEM @ ~4.3s" },
  { phase: "DOWNSWING_TRANSITION", seekTo: 4.8,  note: "D3fcCpKHQEM @ ~4.8s" },
  { phase: "IMPACT",               seekTo: 5.3,  note: "D3fcCpKHQEM @ ~5.3s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 6.3,  note: "D3fcCpKHQEM @ ~6.3s" },
];

async function captureFrame(page, seekTo) {
  return page.evaluate(async (t) => {
    const player = document.querySelector("#movie_player");
    if (!player) throw new Error("No #movie_player found");
    player.seekTo(t, true);
    player.playVideo();
    await new Promise((r) => setTimeout(r, 1500));
    player.pauseVideo();
    await new Promise((r) => setTimeout(r, 400));
    const video = document.querySelector("video");
    const c = document.createElement("canvas");
    c.width = video.videoWidth || 1280;
    c.height = video.videoHeight || 720;
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    return {
      data: c.toDataURL("image/jpeg", 0.9),
      time: Math.round(video.currentTime * 10) / 10,
      w: c.width,
      h: c.height,
    };
  }, seekTo);
}

async function uploadFrame(proSlug, phase, jpegBuffer, sourceNote) {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const crlf = "\r\n";

  const field = (name, value) =>
    `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"${crlf}${crlf}${value}${crlf}`;

  const parts = [
    field("proSlug", proSlug),
    field("clubType", "IRON"),
    field("phase", phase),
    field("sourceNote", sourceNote),
    `--${boundary}${crlf}Content-Disposition: form-data; name="image"; filename="frame.jpg"${crlf}Content-Type: image/jpeg${crlf}${crlf}`,
  ];

  const header = Buffer.from(parts.join(""));
  const footer = Buffer.from(`${crlf}--${boundary}--${crlf}`);
  const body = Buffer.concat([header, jpegBuffer, footer]);

  const res = await fetch(`${RAILWAY_URL}/api/admin/reference-frames`, {
    method: "POST",
    headers: {
      "x-admin-key": ADMIN_SECRET,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${text}`);
  return JSON.parse(text);
}

async function seedPro(browser, proSlug, videoUrl, phases) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`\n📺  Loading ${videoUrl}`);
  await page.goto(videoUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#movie_player", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4000));

  try {
    const btn = await page.$('button[aria-label*="Accept"], button[aria-label*="agree"]');
    if (btn) { await btn.click(); await new Promise((r) => setTimeout(r, 1000)); }
  } catch (_) {}

  // Prime the player so seeking works
  await page.evaluate(() => document.querySelector("#movie_player").playVideo());
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`\n🎬  Capturing 6 ${proSlug} iron swing phases…\n`);

  for (const { phase, seekTo, note } of phases) {
    process.stdout.write(`  ▸ ${phase.padEnd(24)} seekTo=${seekTo}s … `);
    const frame = await captureFrame(page, seekTo);
    const jpegBuffer = Buffer.from(frame.data.replace("data:image/jpeg;base64,", ""), "base64");
    const result = await uploadFrame(proSlug, phase, jpegBuffer, `YouTube: ${note}`);
    console.log(`✅  ${result.key}  (${frame.time}s, ${frame.w}×${frame.h})`);
  }

  await page.close();
}

async function main() {
  console.log(`\n🌐  Launching Puppeteer headless Chrome…`);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  try {
    await seedPro(browser, BRYSON_SLUG, BRYSON_VIDEO, BRYSON_PHASES);
    console.log("\n🏆  All Bryson iron frames seeded successfully!");

    await seedPro(browser, GRANT_SLUG, GRANT_VIDEO, GRANT_PHASES);
    console.log("\n🏆  All Grant Horvat iron frames seeded successfully!");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌  Fatal:", err.message);
  process.exit(1);
});
