// File: src/app/api/search/route.js
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';

// This tells Vercel to use a larger serverless function, which is needed for running a browser
export const config = {
  maxDuration: 60,
};

// The main handler for the serverless function, now using GET
export async function GET(request) {
    // Get the search query from the URL, e.g., /api/search?query=laptops
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return new Response(JSON.stringify({ error: 'Search query is required.' }), { status: 400 });
    }

    let browser = null;

    try {
        // Launch the browser using the new package
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
        
        // Scrape Amazon Search Results
        const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        await page.waitForSelector('.s-main-slot .s-result-item[data-asin]', { timeout: 15000 });

        // Extract Product Data from the Page
        const products = await page.evaluate(() => {
            const results = [];
            const items = document.querySelectorAll('.s-main-slot .s-result-item[data-asin]');
            
            for (let i = 0; i < Math.min(items.length, 10); i++) {
                const item = items[i];
                const asin = item.getAttribute('data-asin');
                if (!asin) continue;

                const nameElement = item.querySelector('h2 a span');
                const priceWholeElement = item.querySelector('.a-price-whole');
                const priceFractionElement = item.querySelector('.a-price-fraction');
                const ratingElement = item.querySelector('.a-icon-alt');
                const reviewsElement = item.querySelector('span.a-size-base');
                const linkElement = item.querySelector('h2 a');

                const name = nameElement ? nameElement.innerText : null;
                const priceWhole = priceWholeElement ? priceWholeElement.innerText.replace(/[\n,]/g, '') : null;
                const priceFraction = priceFractionElement ? priceFractionElement.innerText.replace(/[\n,]/g, '') : null;
                const ratingText = ratingElement ? ratingElement.innerText : null;
                const reviewsText = reviewsElement ? reviewsElement.innerText.replace(/,/g, '') : null;
                
                const productUrl = linkElement ? `https://www.amazon.com${linkElement.getAttribute('href')}` : null;

                if (name && priceWhole && priceFraction && productUrl) {
                    const ratingMatch = ratingText ? ratingText.match(/^[0-9.]+/)?.[0] : null;
                    const reviewsMatch = reviewsText ? reviewsText.match(/^[0-9,]+/)?.[0].replace(/,/g, '') : null;

                    results.push({
                        id: asin,
                        name: name,
                        price: parseFloat(`${priceWhole}.${priceFraction}`),
                        rating: ratingMatch ? parseFloat(ratingMatch) : 'N/A',
                        reviews: reviewsMatch ? parseInt(reviewsMatch) : 0,
                        source: 'Amazon',
                        productUrl: productUrl
                    });
                }
            }
            return results;
        });

        return new Response(JSON.stringify(products), { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to scrape the website. It might be down, have changed its layout, or blocked the request.' }), { status: 500 });
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}