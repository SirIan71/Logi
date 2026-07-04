import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  await page.waitForSelector('.login-btn');
  
  // Click the driver quick login button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Driver') {
      console.log('Clicking Driver button...');
      await btn.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.content();
  if (html.includes('Welcome, James')) {
    console.log('Login successful! Dashboard rendered.');
  } else {
    console.log('Login failed or Dashboard not rendered.');
    console.log(html.substring(0, 1000));
  }
  
  await browser.close();
})();
