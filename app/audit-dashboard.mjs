import { chromium } from "playwright";

const OUT = "C:/Users/bimam/Downloads/Tools Frahma/scratch_visual/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

await page.goto("http://localhost:3004/admin/dashboard", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT + "dashboard_audit.png", fullPage: true });

console.log("Dashboard audited.");
await browser.close();
