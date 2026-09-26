import { supabase } from "../db/supabase.js";
import { scrapePrice } from "../scraper/inePriceScraper.js";
import { savePriceHistory } from "./priceHistory.service.js";

const MAX_SCRAPE_ATTEMPTS = 3;

export async function runTrackedProductScrapes() {
    console.log("Starting tracked product scrape run...");

    const { data: trackedProducts, error } = await supabase
        .from("tracked_products")
        .select("*")
        .order("created_at", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    if (!trackedProducts || trackedProducts.length === 0) {
        console.log("No tracked products found.");
        return [];
    }

    const results = [];

    for (const product of trackedProducts) {
        console.log(
            `Scraping: ${product.product_name} | ${product.option_label}`
        );

        let lastError = null;
        let succeeded = false;

        for (
            let attempt = 1;
            attempt <= MAX_SCRAPE_ATTEMPTS;
            attempt++
        ) {
            console.log(
                `Scrape attempt ${attempt}/${MAX_SCRAPE_ATTEMPTS}: ${product.product_name}`
            );

            try {
                const result = await scrapePrice(
                    product.id,
                    product.store_product_id,
                    product.product_name,
                    product.option_id,
                    product.option_label
                );

                const history = await savePriceHistory({
                    trackedProductId: product.id,
                    productId: product.store_product_id,
                    productName: product.product_name,
                    optionId: product.option_id,
                    optionLabel: product.option_label,
                    price: result.price,
                    stock: result.stock,
                    outcome: "success",
                    attempts: attempt,
                    errorMessage: null
                });

                console.log(
                    `History saved: attempt=${attempt}, outcome=success, historyId=${history.id}`
                );

                results.push({
                    trackedProductId: product.id,
                    success: true,
                    attempts: attempt,
                    historyId: history.id,
                    result
                });

                succeeded = true;
                break;

            } catch (error) {
                lastError = error;

                console.error(
                    `Scrape attempt ${attempt} failed:`,
                    error.message
                );

                const outcome =
                    attempt < MAX_SCRAPE_ATTEMPTS
                        ? "retried"
                        : "failed";

                try {
                    const history = await savePriceHistory({
                        trackedProductId: product.id,
                        productId: product.store_product_id,
                        productName: product.product_name,
                        optionId: product.option_id,
                        optionLabel: product.option_label,
                        price: null,
                        stock: null,
                        outcome,
                        attempts: attempt,
                        errorMessage: error.message
                    });

                    console.log(
                        `History saved: attempt=${attempt}, outcome=${outcome}, historyId=${history.id}`
                    );

                } catch (historyError) {
                    console.error(
                        "Failed to save scrape history:",
                        historyError.message
                    );
                }

                if (attempt < MAX_SCRAPE_ATTEMPTS) {
                    const delay = 1000 * attempt;

                    console.log(
                        `Retrying in ${delay}ms...`
                    );

                    await new Promise(resolve =>
                        setTimeout(resolve, delay)
                    );
                }
            }
        }

        if (!succeeded) {
            results.push({
                trackedProductId: product.id,
                success: false,
                attempts: MAX_SCRAPE_ATTEMPTS,
                error: lastError?.message || "Unknown scrape error"
            });
        }
    }

    console.log("Tracked product scrape run completed.");

    return results;
}