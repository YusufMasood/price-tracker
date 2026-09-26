import { getListings } from "./ineCatalog.service.js";

const catalogPageCache = new Map();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getCatalogPage(page) {
    const now = Date.now();

    // Check if this page is already cached
    const cachedPage = catalogPageCache.get(page);

    if (cachedPage) {
        const cacheAge = now - cachedPage.timestamp;

        if (cacheAge < CACHE_TTL) {
            console.log(`Using cached page ${page}`);
            return cachedPage.data;
        }

        // Cache expired
        catalogPageCache.delete(page);
        console.log(`Cache expired for page ${page}`);
    }

    console.log(`Fetching page ${page} from INE...`);

    const data = await getListings(page, 20);

    const pageData = {
        page: data.page,
        totalPages: data.totalPages,
        results: data.results
    };

    catalogPageCache.set(page, {
        data: pageData,
        timestamp: now
    });

    return pageData;
}