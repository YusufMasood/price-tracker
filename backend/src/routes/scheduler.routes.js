import express from "express";
import { runTrackedProductScrapes } from "../services/scrapeRunner.service.js";

const router = express.Router();

router.post("/scrape", async (req, res) => {
    const schedulerSecret = process.env.SCHEDULER_SECRET;
    const providedSecret = req.headers["x-scheduler-secret"];

    if (!schedulerSecret) {
        console.error(
            "SCHEDULER_SECRET is not configured"
        );

        return res.status(500).json({
            success: false,
            message: "Scheduler is not configured"
        });
    }

    if (!providedSecret || providedSecret !== schedulerSecret) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }

    try {
        console.log("========================================");
        console.log("SCHEDULED SCRAPE STARTED");
        console.log("========================================");

        const results = await runTrackedProductScrapes();

        console.log("========================================");
        console.log("SCHEDULED SCRAPE COMPLETED");
        console.log("========================================");

        res.json({
            success: true,
            message: "Scheduled scrape completed",
            results
        });
    } catch (error) {
        console.error(
            "SCHEDULED SCRAPE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Scheduled scrape failed",
            error: error.message
        });
    }
});

export default router;