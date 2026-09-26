import express from "express";
import { runTrackedProductScrapes } from "../services/scrapeRunner.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const results = await runTrackedProductScrapes();

        res.json({
            success: true,
            results
        });

    } catch (error) {
        console.error("TEST SCRAPE ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;