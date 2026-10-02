const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

const TEAM_URL = 'https://uw.co.uk/partner/portal/team';
const PROFILE_DIR = path.resolve(process.env.PRISM_PROFILE_DIR || path.join(process.cwd(), 'chrome-profile'));
const JSON_OUT = path.resolve(process.cwd(), 'uw-session-export.json');
const B64_OUT = path.resolve(process.cwd(), 'PRISM_UW_STORAGE_STATE_B64.txt');

(async () => {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 480, height: 900 },
    locale: 'en-GB',
    timezoneId: 'Europe/London'
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto(TEAM_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });

  console.log('');
  console.log('PRISM cloud login export');
  console.log('------------------------');
  console.log('Make sure the UW Team page is visible and logged in.');
  console.log('If UW asks you to log in, do that now.');
  console.log('Then return here and press ENTER.');
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question('Press ENTER when the Team page is visible... ', resolve));
  rl.close();

  const storageState = await context.storageState();
  const sessionStorageByOrigin = {};

  for (const p of context.pages()) {
    try {
      const origin = new URL(p.url()).origin;
      if (!origin || origin === 'null') continue;
      const values = await p.evaluate(() => {
        const result = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          result[key] = sessionStorage.getItem(key);
        }
        return result;
      });
      sessionStorageByOrigin[origin] = values;
    } catch (_) {}
  }

  const bundle = {
    exportedAt: new Date().toISOString(),
    storageState,
    sessionStorageByOrigin
  };

  const json = JSON.stringify(bundle);
  const b64 = zlib.gzipSync(Buffer.from(json, 'utf8')).toString('base64');

  fs.writeFileSync(JSON_OUT, JSON.stringify(bundle, null, 2), 'utf8');
  fs.writeFileSync(B64_OUT, b64, 'utf8');

  await context.close();

  console.log('');
  console.log('Done.');
  console.log(`GitHub secret value created at: ${B64_OUT}`);
  console.log('Treat that file like a password. Do not email it or commit it to GitHub.');
  console.log('');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
