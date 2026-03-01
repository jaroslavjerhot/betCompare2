const { chromium } = require('playwright');
const fs = require('fs');

async function fGetFullyRenderedWebsiteInnerText(url) {
    // const url='https://www.oddsportal.com/matches/football/' + fGetDateFormatted(0,'YYYYMMDD')
    //const url='https://www.oddsportal.com/matches/football/20260227/'
    alert('scraping ' + url)
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
 
    await page.goto(
        url,
        { waitUntil: 'networkidle' }
    );
    alert('evaluate ' + url)
    const text = await page.evaluate(() => {
        return document.body.innerText;
    });

    await fs.promises.writeFile(
        'data.json',
        JSON.stringify({ content: text }, null, 2)
    );

    await browser.close();
}

scrape();