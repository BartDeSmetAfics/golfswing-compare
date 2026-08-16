/**
 * Captures iron swing reference frames from YouTube slow-motion videos
 * and uploads them to the Railway admin API.
 *
 * Usage:
 *   ADMIN_SECRET=xxx RAILWAY_URL=https://... node scripts/seed-reference-frames.mjs
 *
 * ADMIN_SECRET must also be set in Railway environment variables.
 */

import puppeteer from "puppeteer";
import { createReadStream } from "fs";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Readable } from "stream";

const RAILWAY_URL =
  process.env.RAILWAY_URL ||
  "https://golfswing-compare-production.up.railway.app";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("❌  Set ADMIN_SECRET env var (must match Railway ADMIN_SECRET)");
  process.exit(1);
}

// Bryson DeChambeau — QyIG8LPBq_w: "Bryson Dechambeau Golf Swing in Super Slow Motion, face on"
// The video is ~56s slow motion of a single iron swing, face-on angle.
// Timing: intro 0-7s, address 7-12s, slo-mo swing 12-56s.
const BRYSON_PHASES = [
  { phase: "ADDRESS",              seekTo: 10, note: "QyIG8LPBq_w @ ~12s" },
  { phase: "TAKEAWAY",             seekTo: 13, note: "QyIG8LPBq_w @ ~15s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 19, note: "QyIG8LPBq_w @ ~21s" },
  { phase: "DOWNSWING_TRANSITION", seekTo: 24, note: "QyIG8LPBq_w @ ~26s" },
  { phase: "IMPACT",               seekTo: 31, note: "QyIG8LPBq_w @ ~33s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 41, note: "QyIG8LPBq_w @ ~43s" },
];
const BRYSON_VIDEO = "https://www.youtube.com/watch?v=QyIG8LPBq_w";

async function getPros() {
  const res = await fetch(`${RAILWAY_URL}/api/admin/reference-frames`, {
    headers: { "x-admin-key": ADMIN_SECRET },
  });
  if (!res.ok) throw new Error(`GET pros failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function captureFrame(page, seekTo) {
  const result = await page.evaluate(async (t) => {
    const player = document.querySelector("#movie_player");
    if (!player) throw new Error("No #movie_player found");
    player.seekTo(t, true);
    player.playVideo();
    await new Promise((r) => setTimeout(r, 2200));
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
  return result;
}

async function uploadFrame(proId, phase, jpegBuffer, sourceNote) {
  // Build FormData manually using boundary
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const crlf = "\r\n";

  const field = (name, value) =>
    `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"${crlf}${crlf}${value}${crlf}`;

  const parts = [
    field("proId", proId),
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

  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log("🔍  Fetching pro IDs from Railway…");
  const pros = await getPros();
  console.log("   Pros:", pros.map((p) => `${p.name} (${p.id})`).join(", "));

  const bryson = pros.find(
    (p) => p.slug === "bryson-dechambeau" || p.name.toLowerCase().includes("bryson")
  );
  if (!bryson) {
    console.error("❌  Bryson not found in pros list. Current pros:", pros);
    process.exit(1);
  }
  console.log(`✅  Found Bryson: ${bryson.id}`);

  console.log("\n🌐  Launching Puppeteer…");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`\n📺  Loading YouTube: ${BRYSON_VIDEO}`);
  await page.goto(BRYSON_VIDEO, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait for player
  await page.waitForSelector("#movie_player", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));

  // Dismiss consent / cookie popup if present
  try {
    const acceptBtn = await page.$('button[aria-label*="Accept"]');
    if (acceptBtn) {
      await acceptBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (_) {}

  console.log("\n🎬  Capturing Bryson DeChambeau frames…\n");

  for (const { phase, seekTo, note } of BRYSON_PHASES) {
    process.stdout.write(`  ▸ ${phase.padEnd(24)} seekTo=${seekTo}s … `);

    const frame = await captureFrame(page, seekTo);
    const base64 = frame.data.replace("data:image/jpeg;base64,", "");
    const jpegBuffer = Buffer.from(base64, "base64");

    const result = await uploadFrame(bryson.id, phase, jpegBuffer, `YouTube: ${note}`);
    console.log(`✅  uploaded → ${result.key}  (frame at ${frame.time}s, ${frame.w}×${frame.h})`);
  }

  await browser.close();
  console.log("\n🏆  All Bryson iron frames seeded!");
}

main().catch((err) => {
  console.error("❌  Fatal:", err.message);
  process.exit(1);
});
