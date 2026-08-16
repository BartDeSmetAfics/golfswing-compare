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

// ─── Bryson DeChambeau ───────────────────────────────────────────────────────
const BRYSON_SLUG = "bryson-dechambeau";

// FACE_ON: QyIG8LPBq_w — "Bryson Dechambeau Golf Swing in Super Slow Motion, face on" (56s)
const BRYSON_FACE_ON_VIDEO = "https://www.youtube.com/watch?v=QyIG8LPBq_w";
const BRYSON_FACE_ON_PHASES = [
  { phase: "ADDRESS",              seekTo: 5,    note: "QyIG8LPBq_w @ ~5s"  },
  { phase: "TAKEAWAY",             seekTo: 10,   note: "QyIG8LPBq_w @ ~10s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 22,   note: "QyIG8LPBq_w @ ~22s" },
  { phase: "DOWNSWING_TRANSITION", seekTo: 27,   note: "QyIG8LPBq_w @ ~27s" },
  { phase: "IMPACT",               seekTo: 38,   note: "QyIG8LPBq_w @ ~38s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 45,   note: "QyIG8LPBq_w @ ~45s" },
];

// DOWN_THE_LINE: t6nkO7Vf5EI (Shorts → watch URL, 360×640)
// Sequence at 1s (address) → 2s (takeaway) → 3s (top) → 4s (follow)
const BRYSON_DTL_VIDEO = "https://www.youtube.com/watch?v=t6nkO7Vf5EI";
const BRYSON_DTL_PHASES = [
  { phase: "ADDRESS",              seekTo: 1,    note: "t6nkO7Vf5EI @ ~1s"   },
  { phase: "TAKEAWAY",             seekTo: 2,    note: "t6nkO7Vf5EI @ ~2s"   },
  { phase: "TOP_OF_BACKSWING",     seekTo: 3,    note: "t6nkO7Vf5EI @ ~3s"   },
  { phase: "DOWNSWING_TRANSITION", seekTo: 3.2,  note: "t6nkO7Vf5EI @ ~3.2s" },
  { phase: "IMPACT",               seekTo: 3.6,  note: "t6nkO7Vf5EI @ ~3.6s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 4,    note: "t6nkO7Vf5EI @ ~4s"   },
];

// ─── Grant Horvat ─────────────────────────────────────────────────────────────
const GRANT_SLUG = "grant-horvat";

// FACE_ON: D3fcCpKHQEM — "Grant Horvat Slow Motion Golf Iron Swing!" (14s, 3/4 front view)
const GRANT_FACE_ON_VIDEO = "https://www.youtube.com/watch?v=D3fcCpKHQEM";
const GRANT_FACE_ON_PHASES = [
  { phase: "ADDRESS",              seekTo: 0.8,  note: "D3fcCpKHQEM @ ~0.8s" },
  { phase: "TAKEAWAY",             seekTo: 1.8,  note: "D3fcCpKHQEM @ ~1.8s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 4.3,  note: "D3fcCpKHQEM @ ~4.3s" },
  { phase: "DOWNSWING_TRANSITION", seekTo: 4.8,  note: "D3fcCpKHQEM @ ~4.8s" },
  { phase: "IMPACT",               seekTo: 5.3,  note: "D3fcCpKHQEM @ ~5.3s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 6.3,  note: "D3fcCpKHQEM @ ~6.3s" },
];

// DOWN_THE_LINE: KropxSzWGOo (Shorts → watch URL, 360×640)
// First swing: 0.5s (takeaway) → 1s (top) → 1.5s (follow); freeze-frame address at 14s
const GRANT_DTL_VIDEO = "https://www.youtube.com/watch?v=KropxSzWGOo";
const GRANT_DTL_PHASES = [
  { phase: "ADDRESS",              seekTo: 14,   note: "KropxSzWGOo @ ~14s"  },
  { phase: "TAKEAWAY",             seekTo: 0.5,  note: "KropxSzWGOo @ ~0.5s" },
  { phase: "TOP_OF_BACKSWING",     seekTo: 1,    note: "KropxSzWGOo @ ~1s"   },
  { phase: "DOWNSWING_TRANSITION", seekTo: 1.2,  note: "KropxSzWGOo @ ~1.2s" },
  { phase: "IMPACT",               seekTo: 1.3,  note: "KropxSzWGOo @ ~1.3s" },
  { phase: "FOLLOW_THROUGH",       seekTo: 1.5,  note: "KropxSzWGOo @ ~1.5s" },
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

async function uploadFrame(proSlug, phase, cameraAngle, jpegBuffer, sourceNote) {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const crlf = "\r\n";

  const field = (name, value) =>
    `--${boundary}${crlf}Content-Disposition: form-data; name="${name}"${crlf}${crlf}${value}${crlf}`;

  const parts = [
    field("proSlug", proSlug),
    field("clubType", "IRON"),
    field("phase", phase),
    field("cameraAngle", cameraAngle),
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

async function seedPro(browser, proSlug, videoUrl, phases, cameraAngle = "FACE_ON", viewport = { width: 1280, height: 720 }) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );
  await page.setViewport(viewport);

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

  console.log(`\n🎬  Capturing 6 ${proSlug} [${cameraAngle}] iron swing phases…\n`);

  for (const { phase, seekTo, note } of phases) {
    process.stdout.write(`  ▸ ${phase.padEnd(24)} seekTo=${seekTo}s … `);
    const frame = await captureFrame(page, seekTo);
    const jpegBuffer = Buffer.from(frame.data.replace("data:image/jpeg;base64,", ""), "base64");
    const result = await uploadFrame(proSlug, phase, cameraAngle, jpegBuffer, `YouTube: ${note}`);
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

  const target = process.env.SEED_PRO ?? "all";

  try {
    const dtlViewport = { width: 720, height: 1280 }; // portrait for Shorts

    if (target === "all" || target === "bryson") {
      if (!process.env.SKIP_FACE_ON) {
        await seedPro(browser, BRYSON_SLUG, BRYSON_FACE_ON_VIDEO, BRYSON_FACE_ON_PHASES, "FACE_ON");
        console.log("\n🏆  Bryson FACE_ON frames seeded!");
      }
      await seedPro(browser, BRYSON_SLUG, BRYSON_DTL_VIDEO, BRYSON_DTL_PHASES, "DOWN_THE_LINE", dtlViewport);
      console.log("🏆  Bryson DOWN_THE_LINE frames seeded!");
    }
    if (target === "all" || target === "grant") {
      if (!process.env.SKIP_FACE_ON) {
        await seedPro(browser, GRANT_SLUG, GRANT_FACE_ON_VIDEO, GRANT_FACE_ON_PHASES, "FACE_ON");
        console.log("\n🏆  Grant Horvat FACE_ON frames seeded!");
      }
      await seedPro(browser, GRANT_SLUG, GRANT_DTL_VIDEO, GRANT_DTL_PHASES, "DOWN_THE_LINE", dtlViewport);
      console.log("🏆  Grant Horvat DOWN_THE_LINE frames seeded!");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌  Fatal:", err.message);
  process.exit(1);
});
