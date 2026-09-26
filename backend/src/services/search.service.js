import { getCatalog } from "./catalogSync.service.js";

function calculateScore(product, query) {
    const name = product.name?.toLowerCase() || "";
    const brand = product.brand?.toLowerCase() || "";
    const category = product.category?.toLowerCase() || "";
    const sku = product.sku?.toLowerCase() || "";

    let score = 0;

    if (name === query) {
        score += 100;
    } else if (name.startsWith(query)) {
        score += 80;
    } else if (name.includes(query)) {
        score += 60;
    }

    if (brand.includes(query)) {
        score += 40;
    }

    if (category.includes(query)) {
        score += 30;
    }

    if (sku.includes(query)) {
        score += 20;
    }

    return score;
}

export async function searchProducts(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return [];
    }

    const catalog = getCatalog();


    const results = [];

    for (const product of catalog) {
        const name = product.name?.toLowerCase() || "";
        const brand = product.brand?.toLowerCase() || "";
        const category = product.category?.toLowerCase() || "";
        const sku = product.sku?.toLowerCase() || "";

        const score = calculateScore(product, normalizedQuery);

if (score > 0) {
    results.push({
        ...product,
        score
    });
}
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 10);
}