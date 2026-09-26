import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testScrapeRoutes from "./routes/testScrape.routes.js";
import productsRouter from "./routes/products.routes.js";
import { syncCatalog } from "./services/catalogSync.service.js";
import trackedProductsRouter from "./routes/trackedProducts.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/products", productsRouter);
app.use("/api/tracked-products", trackedProductsRouter);
app.use("/api/test-scrape", testScrapeRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Price Tracker backend is running"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

syncCatalog()
    .catch(error => {
        console.error("Initial catalog sync failed:", error.message);
    });