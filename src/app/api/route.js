// File: src/app/api/search/route.js
import playwright from 'playwright-aws-lambda';

export const config = {
  maxDuration: 60,
};

async function scrapeWalmart(query) {
    let browser = null;
    try {
        console.log(`Launching browser for Walmart...`);
        browser = await playwright.launchChromium({ headless: true });
        const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' });
        const page = await context.newPage();
        
        console.log(`Scraping Walmart for: ${query}`);
        await page.goto(`https://www.walmart.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('[data-item-id]', { timeout: 20000 });

        const products = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('[data-item-id]');
            for (let i = 0; i < Math.min(items.length, 10); i++) {
                const item = items[i];
                try {
                    const id = item.getAttribute('data-item-id');
                    const nameElement = item.querySelector('span[data-automation-id="product-title"]');
                    const priceElement = item.querySelector('[data-automation-id="product-price"] .f2');
                    const linkElement = item.querySelector('a');

                    if (nameElement && priceElement && linkElement) {
                        const name = nameElement.innerText.trim();
                        const priceText = priceElement.innerText.replace(/[$,]/g, '').trim();
                        const price = parseFloat(priceText);
                        const productUrl = new URL(linkElement.href, 'https://www.walmart.com').href;

                        if (name && price && productUrl) {
                            results.push({ id, name, price, source: 'Walmart', productUrl });
                        }
                    }
                } catch (e) { console.log('Could not parse a Walmart item:', e); }
            }
            return results;
        });
        
        console.log(`Found ${products.length} products on Walmart.`);
        return products;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// We will disable the Amazon scraper for now as it's much harder
const scraperFunctions = {
    'Walmart': scrapeWalmart,
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const sources = searchParams.get('sources')?.split(',') || [];

    if (!query || sources.length === 0) {
        return new Response(JSON.stringify({ error: 'Search query and sources are required.' }), { status: 400 });
    }

    try {
        let allProducts = [];
        for (const source of sources) {
            const scraper = scraperFunctions[source];
            if (scraper) {
                try {
                    const results = await scraper(query);
                    allProducts = allProducts.concat(results);
                } catch (error) {
                    console.error(`Failed to scrape ${source}:`, error.message);
                }
            }
        }
        return new Response(JSON.stringify(allProducts), { status: 200 });
    } catch (error) {
        console.error("A critical error occurred:", error);
        return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred during scraping.' }), { status: 500 });
    }
}