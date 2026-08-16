/**
 * Captures frames at given timestamps from YouTube videos and saves them
 * as local JPEGs for visual verification.
 *
 * Usage:
 *   node scripts/preview-frames.mjs
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

// Shorts-URLs omgezet naar gewone watch-URLs (zelfde video-ID, werkt met #movie_player)
const VIDEOS = [
  {
    // Grant Horvat DTL — vroeg in de eerste swing: TAKEAWAY (voor t=1 top) + DOWNSWING
    label: "grant_dtl_early",
    url: "https://www.youtube.com/watch?v=KropxSzWGOo",
    timestamps: [0.5, 1.5],
  },
];

const OUT_DIR = join(__dirname, "preview");
mkdirSync(OUT_DIR, { recursive: true });

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
    c.width = video.videoWidth || 720;
    c.height = video.videoHeight || 1280;
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    return {
      data: c.toDataURL("image/jpeg", 0.88),
      w: c.width,
      h: c.height,
    };
  }, seekTo);
}

async function previewVideo(browser, label, url, timestamps) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
  await page.setViewport({ width: 720, height: 1280 });

  console.log(`\n📺  Loading ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#movie_player", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4000));

  try {
    const btn = await page.$('button[aria-label*="Accept"], button[aria-label*="agree"]');
    if (btn) { await btn.click(); await new Promise((r) => setTimeout(r, 1000)); }
  } catch (_) {}

  await page.evaluate(() => document.querySelector("#movie_player")?.playVideo());
  await new Promise((r) => setTimeout(r, 2000));

  console.log(`📸  Capturing ${timestamps.length} frames for ${label}…\n`);
  for (const seekTo of timestamps) {
    process.stdout.write(`  ▸ t=${String(seekTo).padStart(2)}s … `);
    try {
      const frame = await captureFrame(page, seekTo);
      const buf = Buffer.from(frame.data.replace("data:image/jpeg;base64,", ""), "base64");
      const filename = `${label}_t=${String(seekTo).padStart(2, "0")}s.jpg`;
      writeFileSync(join(OUT_DIR, filename), buf);
      console.log(`saved (${frame.w}×${frame.h})`);
    } catch (e) {
      console.log(`failed: ${e.message}`);
    }
  }

  await page.close();
}

async function main() {
  console.log("🌐  Launching Puppeteer…");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });

  try {
    for (const { label, url, timestamps } of VIDEOS) {
      await previewVideo(browser, label, url, timestamps);
    }
  } finally {
    await browser.close();
  }

  console.log(`\n✅  Done. Check scripts/preview/ for all frames.`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
