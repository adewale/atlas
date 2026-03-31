import { chromium } from 'playwright';
const url = process.argv[2], name = process.argv[3] || 'screen';
const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route(/(googleapis|gstatic|google)/, r => r.abort());
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'commit', timeout: 10000 }).catch(() => null);
await page.waitForTimeout(3000);
await page.evaluate(() => document.fonts?.ready);
await page.screenshot({ path: `/tmp/screenshots/${name}.png`, fullPage: false, timeout: 10000 }).catch(e =>
  console.log('Fail:', e.message.split('\n')[0]));
console.log(`✓ ${name}`);
await browser.close();
