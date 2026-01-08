const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:3000/listing/73429415';
  console.log('Testing URL:', url);
  // wait for server to be ready
  const waitForServer = async (url, attempts = 20, intervalMs = 1000) => {
    const http = require('http');
    for (let i = 0; i < attempts; i++) {
      try {
        await new Promise((res, rej) => {
          const req = http.get(url, (r) => {
            res();
            r.destroy();
          });
          req.on('error', rej);
          req.setTimeout(2000, () => {
            req.destroy();
            rej(new Error('timeout'));
          });
        });
        return true;
      } catch (e) {
        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
    return false;
  };

  const ready = await waitForServer(url);
  if (!ready) {
    throw new Error(`Server not reachable at ${url}`);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the breakdown trigger button (title or aria-label)
    const btnSelector =
      'button[aria-label="Open score breakdown"], button[title="Open score breakdown"]';
    await page.waitForSelector(btnSelector, { timeout: 8000 });
    console.log('Found breakdown button, clicking...');
    await page.click(btnSelector);

    // Wait for modal heading
    await page.waitForFunction(
      () => {
        return (
          !!document.querySelector('h3') &&
          document.querySelector('h3').textContent.includes('Score Breakdown')
        );
      },
      { timeout: 8000 }
    );

    const modalText = await page.evaluate(() => {
      const h = document.querySelector('h3');
      if (!h) return null;
      const container = h.closest('div[role]') || h.parentElement;
      return container ? container.innerText : h.innerText;
    });

    console.log('Modal opened. Snippet:');
    console.log(modalText ? modalText.split('\n').slice(0, 10).join('\n') : 'no modal text');
    console.log('Puppeteer check: SUCCESS');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Puppeteer check: FAILED', err);
    await browser.close();
    process.exit(2);
  }
})();
