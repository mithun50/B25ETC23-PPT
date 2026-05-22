const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });

  const fileUrl = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
  console.log('Opening:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Zoom in 25% via CSS zoom for larger text and elements
  await page.evaluate(() => {
    document.body.style.zoom = '1.25';
  });
  await page.waitForTimeout(500);

  const TOTAL = 12;

  for (let i = 0; i < TOTAL; i++) {
    // Navigate to slide i
    await page.evaluate((idx) => {
      window.go(idx);
    }, i);

    // Wait for transition animation (700ms)
    await page.waitForTimeout(700);

    // Verify slide is active before screenshot
    await page.waitForFunction((idx) => {
      const slide = document.querySelectorAll('.slide')[idx];
      return slide && slide.classList.contains('active');
    }, i, { timeout: 3000 });

    // Extra wait for animated content (bars, timelines) to fully render
    const extraWait = [4, 5, 6, 7].includes(i) ? 1800 : 1000;
    await page.waitForTimeout(extraWait);

    const slideNum = String(i + 1).padStart(2, '0');
    const outPath = path.join(__dirname, 'slides', `slide_${slideNum}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured slide ${slideNum} (${i + 1}/${TOTAL})`);
  }

  await browser.close();
  console.log('Done! All 12 slides captured.');
})();
