import express from "express";
import { getCatalogPage } from "../services/catalogCache.service.js";
import {
    getListings,
    getProduct
} from "../services/ineCatalog.service.js";

import { searchProducts } from "../services/search.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const data = await getListings(page, limit);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Failed to fetch INE listings:", error.message);

        res.status(502).json({
            success: false,
            message: "Failed to fetch products from INE Store"
        });
    }
});

router.get("/catalog-page-test", async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;

        const data = await getCatalogPage(page);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("CATALOG PAGE TEST ERROR:", error);

        res.status(502).json({
            success: false,
            message: error.message
        });
    }
});


router.get("/search", async (req, res) => {
    try {
        const query = req.query.q || "";

        const results = await searchProducts(query);

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        console.error("PRODUCT SEARCH ERROR:", error);

        res.status(502).json({
            success: false,
            message: "Failed to search products"
        });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const data = await getProduct(productId);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Failed to fetch product:", error.message);

        res.status(502).json({
            success: false,
            message: "Failed to fetch product from INE Store"
        });
    }
});



export default router;