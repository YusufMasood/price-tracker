import { getListings } from "./ineCatalog.service.js";

let catalog = [];
let isSyncing = false;
let isReady = false;

export async function syncCatalog() {
    if (isSyncing) {
        console.log("Catalog sync already running...");
        return;
    }

    isSyncing = true;
    isReady = false;

    try {
        console.log("Starting catalog sync...");

        // First request tells us how many pages exist
        const firstPage = await getListings(1, 20);

        const totalPages = firstPage.totalPages;

        let products = [...firstPage.results];

        console.log(
            `Catalog contains ${totalPages} pages.`
        );

        // Fetch remaining pages sequentially
        for (let page = 2; page <= totalPages; page++) {
            console.log(
                `Syncing catalog page ${page}/${totalPages}...`
            );

            const data = await getListings(page, 20);

            products.push(...data.results);
        }

        catalog = products;
        isReady = true;

        console.log(
            `Catalog sync complete. ${catalog.length} products loaded.`
        );

    } catch (error) {
        console.error(
            "Catalog sync failed:",
            error.message
        );

        isReady = false;

        throw error;

    } finally {
        isSyncing = false;
    }
}

export function getCatalog() {
    return catalog;
}

export function isCatalogReady() {
    return isReady;
}