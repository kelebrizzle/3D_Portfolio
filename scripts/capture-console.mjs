import fs from 'fs';
import { chromium } from 'playwright';

async function run() {
  const url = 'http://localhost:4173';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() });
    console.log(`[console:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    logs.push({ type: 'pageerror', text: err.message });
    console.log('[pageerror]', err.message);
  });
  page.on('requestfailed', (req) => {
    logs.push({ type: 'requestfailed', url: req.url(), status: req.failure()?.errorText });
    console.log('[requestfailed]', req.url(), req.failure()?.errorText);
  });

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    console.log('HTTP status:', resp && resp.status());
    // wait a little for runtime logs
    await page.waitForTimeout(2000);
    const html = await page.content();
    fs.writeFileSync('scripts/captured_page.html', html);
    console.log('Saved page HTML to scripts/captured_page.html');
  } catch (e) {
    console.error('Error loading page:', e.message);
  } finally {
    await browser.close();
    // output collected logs summary
    console.log('Collected logs:', JSON.stringify(logs, null, 2));
  }
}

run();
