// File: src/app/api/search/route.js
export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const apiKey = process.env.BROWSERLESS_API_KEY;

    if (!query) {
        return new Response(JSON.stringify({ error: 'Query is required.' }), { status: 400 });
    }

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error: API key is missing.' }), { status: 500 });
    }

    const walmartUrl = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(`https://production-sfo.browserless.io/function?token=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: async ({ page, context }) => { // Define the function here
                    const { url } = context;
                    await page.goto(url, { waitUntil: 'domcontentloaded' });
                    await page.waitForSelector('[data-item-id]', { timeout: 20000 });

                    const products = await page.evaluate(() => {
                        const results = [];
                        const items = document.querySelectorAll('[data-item-id]');
                        for (let i = 0; i < Math.min(items.length, 10); i++) {
                            const item = items[i];
                            try {
                                const id = item.getAttribute('data-item-id');
                                const name = item.querySelector('span[data-automation-id="product-title"]')?.innerText.trim();
                                const price = parseFloat(
                                    item.querySelector('[data-automation-id="product-price"] .f2')?.innerText.replace(/[$,]/g, '').trim()
                                );
                                const productUrl = new URL(item.querySelector('a')?.href, 'https://www.walmart.com').href;
                                if (id && name && price && productUrl) {
                                    results.push({ id, name, price, productUrl, source: 'Walmart' });
                                }
                            } catch (e) {
                                // ignore single item errors
                            }
                        }
                        return results;
                    });
                    return products;
                },
                context: {
                    url: walmartUrl,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless API failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });

    } catch (error) {
        console.error("Error scraping via Browserless:", error);
        return new Response(JSON.stringify({ error: `Scraping failed: ${error.message}` }), { status: 500 });
    }
}