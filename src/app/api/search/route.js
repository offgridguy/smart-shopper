import * as cheerio from 'cheerio';

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
        // Step 1: Use the correct /content endpoint to get the raw HTML
        const response = await fetch(`https://production-sfo.browserless.io/content?token=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: walmartUrl,
                // We can add options to wait for specific elements if needed
                waitFor: '[data-item-id]',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Browserless API failed with status ${response.status}: ${errorText}`);
        }

        // The /content endpoint returns raw HTML, not JSON
        const html = await response.text();

        // Step 2: Parse the HTML with Cheerio
        const $ = cheerio.load(html);
        const products = [];

        $('[data-item-id]').each((index, element) => {
            if (index >= 10) return; // Limit to 10 items

            try {
                const id = $(element).attr('data-item-id');
                const name = $(element).find('span[data-automation-id="product-title"]').text().trim();
                const price = parseFloat($(element).find('[data-automation-id="product-price"] .f2').text().replace(/[$,]/g, '').trim());
                const productUrl = new URL($(element).find('a').attr('href'), 'https://www.walmart.com').href;

                if (id && name && price && productUrl) {
                    products.push({ id, name, price, productUrl, source: 'Walmart' });
                }
            } catch (e) {
                console.error('Error parsing an item:', e);
            }
        });

        return new Response(JSON.stringify(products), { status: 200 });

    } catch (error) {
        console.error("Error in scraping process:", error);
        return new Response(JSON.stringify({ error: `Scraping failed: ${error.message}` }), { status: 500 });
    }
}