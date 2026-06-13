import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe"
].find(existsSync);

const URL = process.env.SMOKE_URL || "http://localhost:5180/";
const errors = [];
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--no-sandbox", "--autoplay-policy=no-user-gesture-required"]
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 720 });
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("response", (r) => { if (r.status() === 404 && !r.url().includes("favicon")) errors.push("404: " + r.url()); });

// Unlock the gate, then reload into the game.
await page.goto(URL, { waitUntil: "networkidle2" });
await page.evaluate(() => localStorage.setItem("dad_unlocked", "1"));
await page.reload({ waitUntil: "networkidle2" });

// wait for the game instance, then drive scenes directly
await page.waitForFunction(() => window.__GAME__ && window.__GAME__.isBooted, { timeout: 8000 });
const go = async (fn, label, settleMs = 2200) => {
  await page.evaluate(fn);
  await wait(settleMs);
  await page.screenshot({ path: `scripts/_shot_${label}.png` });
};

// Hub (big head, DJ label-on-trunk, gear). Spawn "from danielle" to land mid-yard.
await go(() => window.__GAME__.scene.start("HubScene", { from: "danielle" }), "hub", 2600);
// open the settings panel via the game's input by faking a click is unreliable;
// instead just confirm the Hub renders. Then a chapter, a memory, and the HOF.
await go(() => window.__GAME__.scene.start("ChapterScene", { chapter: "danielle" }), "chapter", 2600);
await go(() => window.__GAME__.scene.start("MemoryScene", {
  chapter: "danielle", index: 0, callerScene: "ChapterScene",
  memData: { type: "image", src: "assets/memories/danielle/memory1.jpg",
    secondary: "assets/memories/danielle/memory1_b.jpg",
    date: "April 2021", caption: "Cabo San Lucas — a really fun family vacation!" }
}), "memory", 2600);
await go(() => window.__GAME__.scene.start("HallOfFameScene"), "hof", 2600);

console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console/page errors (favicon 404 ignored)");
await browser.close();
