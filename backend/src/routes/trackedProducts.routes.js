import express from "express";
import {
    getPriceHistory,
    getAllPriceHistory
} from "../services/priceHistory.service.js";

import {
    addTrackedProduct,
    getTrackedProducts
} from "../services/trackedProducts.service.js";
import { getProduct } from "../services/ineCatalog.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { productId, optionId } = req.body;

        if (!productId || !optionId) {
            return res.status(400).json({
                success: false,
                message: "productId and optionId are required"
            });
        }

        const product = await getProduct(productId);

        const selectedOption = product.options?.find(
            option => option.id === optionId
        );

        if (!selectedOption) {
            return res.status(400).json({
                success: false,
                message: "Invalid option for this product"
            });
        }

        const trackedProduct = {
            productId: product.id,
            productName: product.name,
            optionId: selectedOption.id,
            optionLabel: selectedOption.label
        };

        const saved = await addTrackedProduct(trackedProduct);

        res.status(201).json({
            success: true,
            data: saved
        });

    } catch (error) {
        console.error("TRACK PRODUCT ERROR:", error);

        res.status(502).json({
            success: false,
            message: "Failed to track product"
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const data = await getTrackedProducts();

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GET TRACKED PRODUCTS ERROR:", error);

        res.status(502).json({
            success: false,
            message: "Failed to fetch tracked products"
        });
    }
});

router.get("/history/export", async (req, res) => {
    try {
        const history = await getAllPriceHistory();

        const headers = [
            "Store Product ID",
            "Product Name",
            "Selected Option",
            "UTC Timestamp",
            "Price",
            "Stock",
            "Outcome"
        ];

        const rows = history.map(record => [
            record.store_product_id,
            record.product_name,
            record.option_label,
            new Date(record.scraped_at).toISOString(),
            record.price ?? "",
            record.stock ?? "",
            record.outcome
        ]);

        const escapeCsv = (value) => {
            const text = String(value ?? "");

            if (
                text.includes(",") ||
                text.includes('"') ||
                text.includes("\n")
            ) {
                return `"${text.replace(/"/g, '""')}"`;
            }

            return text;
        };

        const csv = [
            headers.map(escapeCsv).join(","),
            ...rows.map(row => row.map(escapeCsv).join(","))
        ].join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="price-history.csv"'
        );

        res.send(csv);
    } catch (error) {
        console.error("CSV EXPORT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to export price history"
        });
    }
});

router.get("/:id/history", async (req, res) => {
    try {
        const trackedProductId = Number(req.params.id);

        if (!Number.isInteger(trackedProductId) || trackedProductId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid tracked product ID"
            });
        }

        const history = await getPriceHistory(trackedProductId);

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error("PRICE HISTORY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch price history"
        });
    }
});


export default router;