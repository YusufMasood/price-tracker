import express from "express";
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

export default router;