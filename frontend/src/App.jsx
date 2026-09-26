import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:3000/api";

function App() {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productDetails, setProductDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    const [trackedProducts, setTrackedProducts] = useState([]);
    const [trackedLoading, setTrackedLoading] = useState(false);

    const [tracking, setTracking] = useState(false);
    const [trackingMessage, setTrackingMessage] = useState("");

    const [historyProductId, setHistoryProductId] = useState(null);
    const [priceHistory, setPriceHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        loadTrackedProducts();
    }, []);

    async function loadTrackedProducts() {
        setTrackedLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/tracked-products`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load tracked products"
                );
            }

            setTrackedProducts(data.data);
        } catch (error) {
            console.error(
                "TRACKED PRODUCTS ERROR:",
                error
            );

            setError(
                error.message ||
                "Failed to load tracked products."
            );
        } finally {
            setTrackedLoading(false);
        }
    }

    async function loadPriceHistory(trackedProductId) {
        setHistoryLoading(true);
        setHistoryProductId(trackedProductId);
        setPriceHistory([]);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/tracked-products/${trackedProductId}/history`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load price history"
                );
            }

            setPriceHistory(data.data);
        } catch (error) {
            console.error(
                "PRICE HISTORY ERROR:",
                error
            );

            setError(
                error.message ||
                "Failed to load price history."
            );
        } finally {
            setHistoryLoading(false);
        }
    }

    function closeHistory() {
        setHistoryProductId(null);
        setPriceHistory([]);
    }

    async function searchProducts() {
        const searchQuery = query.trim();

        if (!searchQuery) {
            setProducts([]);
            setError("");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/products/search?q=${encodeURIComponent(
                    searchQuery
                )}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to search products"
                );
            }

            setProducts(data.results);
        } catch (error) {
            console.error("SEARCH ERROR:", error);
            setError("Failed to search products.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    async function selectProduct(product) {
        setSelectedProduct(product);
        setSelectedOption(null);
        setProductDetails(null);
        setDetailsLoading(true);
        setTrackingMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/products/${product.id}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load product details"
                );
            }

            setProductDetails(data.data);
        } catch (error) {
            console.error(
                "PRODUCT DETAILS ERROR:",
                error
            );

            setError(
                "Failed to load product details."
            );
        } finally {
            setDetailsLoading(false);
        }
    }

    async function trackSelectedOption() {
        if (!selectedProduct || !selectedOption) {
            return;
        }

        setTracking(true);
        setTrackingMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/tracked-products`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productId: selectedProduct.id,
                        productName: selectedProduct.name,
                        optionId: selectedOption.id,
                        optionLabel: selectedOption.label,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to track product"
                );
            }

            setTrackingMessage(
                `${selectedProduct.name} — ${selectedOption.label} is now being tracked.`
            );

            await loadTrackedProducts();
        } catch (error) {
            console.error(
                "TRACK PRODUCT ERROR:",
                error
            );

            setError(
                error.message ||
                "Failed to track product."
            );
        } finally {
            setTracking(false);
        }
    }

    function closeProductDetails() {
        setSelectedProduct(null);
        setProductDetails(null);
        setSelectedOption(null);
        setTrackingMessage("");
        setDetailsLoading(false);
    }

    function exportCsv() {
        window.location.href =
            `${API_BASE_URL}/tracked-products/history/export`;
    }

    return (
        <main className="app">
            <section className="hero-section">
                <div className="hero-content">
                    <p className="eyebrow">
                        INE PRICE TRACKER
                    </p>

                    <h1>
                        Track prices.
                        <br />
                        Catch the right moment.
                    </h1>

                    <p className="hero-description">
                        Search the INE store, choose a
                        product option, and track its price
                        and stock over time.
                    </p>

                    <div className="search-box">
                        <input
                            type="text"
                            value={query}
                            placeholder="Search products..."
                            onChange={(event) =>
                                setQuery(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    searchProducts();
                                }
                            }}
                        />

                        <button
                            type="button"
                            onClick={searchProducts}
                            disabled={loading}
                        >
                            {loading
                                ? "Searching..."
                                : "Search"}
                        </button>
                    </div>
                </div>
            </section>

            <section className="results-section">

                {/* TRACKED PRODUCTS */}

                <section className="tracked-section">
                    <div className="section-header">
                        <div>
                            <p className="section-label">
                                YOUR TRACKED PRODUCTS
                            </p>

                            <h2>
                                Products you're monitoring
                            </h2>
                        </div>

                        <div className="tracked-header-actions">
                            {trackedProducts.length > 0 && (
                                <>
                                    <span className="result-count">
                                        {trackedProducts.length}{" "}
                                        tracked
                                    </span>

                                    <button
                                        type="button"
                                        className="export-button"
                                        onClick={exportCsv}
                                    >
                                        EXPORT CSV
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {trackedLoading && (
                        <div className="empty-state">
                            Loading tracked products...
                        </div>
                    )}

                    {!trackedLoading &&
                        trackedProducts.length === 0 && (
                            <div className="empty-state">
                                No products are being
                                tracked yet.
                            </div>
                        )}

                    {!trackedLoading &&
                        trackedProducts.length > 0 && (
                            <div className="tracked-grid">
                                {trackedProducts.map(
                                    (product) => (
                                        <article
                                            className="tracked-card"
                                            key={product.id}
                                        >
                                            <div className="tracked-card-top">
                                                <span className="product-category">
                                                    TRACKING
                                                </span>

                                                <span className="product-id">
                                                    #
                                                    {
                                                        product.store_product_id
                                                    }
                                                </span>
                                            </div>

                                            <h3>
                                                {
                                                    product.product_name
                                                }
                                            </h3>

                                            <p className="tracked-option">
                                                {
                                                    product.option_label
                                                }
                                            </p>

                                            <div className="tracked-card-footer">
                                                <span>
                                                    Added{" "}
                                                    {new Date(
                                                        product.created_at
                                                    ).toLocaleDateString()}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="history-button"
                                                    onClick={() =>
                                                        loadPriceHistory(
                                                            product.id
                                                        )
                                                    }
                                                >
                                                    {historyProductId ===
                                                    product.id
                                                        ? "Refreshing..."
                                                        : "View History"}
                                                </button>
                                            </div>

                                            {historyProductId ===
                                                product.id && (
                                                <div className="history-panel">
                                                    <div className="history-panel-header">
                                                        <div>
                                                            <p className="section-label">
                                                                PRICE
                                                                HISTORY
                                                            </p>

                                                            <h4>
                                                                Scrape
                                                                attempts
                                                            </h4>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="close-history"
                                                            onClick={
                                                                closeHistory
                                                            }
                                                        >
                                                            Close
                                                        </button>
                                                    </div>

                                                    {historyLoading && (
                                                        <div className="history-loading">
                                                            Loading
                                                            history...
                                                        </div>
                                                    )}

                                                    {!historyLoading &&
                                                        priceHistory.length ===
                                                            0 && (
                                                            <div className="history-loading">
                                                                No scrape
                                                                history
                                                                available.
                                                            </div>
                                                        )}

                                                    {!historyLoading &&
                                                        priceHistory.length >
                                                            0 && (
                                                            <div className="history-list">
                                                                {priceHistory
                                                                    .slice()
                                                                    .reverse()
                                                                    .map(
                                                                        (
                                                                            record
                                                                        ) => (
                                                                            <div
                                                                                className="history-row"
                                                                                key={
                                                                                    record.id
                                                                                }
                                                                            >
                                                                                <div className="history-date">
                                                                                    {new Date(
                                                                                        record.scraped_at
                                                                                    ).toLocaleString()}
                                                                                </div>

                                                                                <div className="history-price">
                                                                                    {record.price !==
                                                                                    null
                                                                                        ? `₹${Number(
                                                                                              record.price
                                                                                          ).toLocaleString(
                                                                                              "en-IN"
                                                                                          )}`
                                                                                        : "—"}
                                                                                </div>

                                                                                <div className="history-stock">
                                                                                    {record.stock !==
                                                                                    null
                                                                                        ? `${record.stock} in stock`
                                                                                        : "—"}
                                                                                </div>

                                                                                <span
                                                                                    className={`history-outcome history-${record.outcome}`}
                                                                                >
                                                                                    {
                                                                                        record.outcome
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    )}
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                </section>

                {/* SEARCH RESULTS */}

                <div className="section-header">
                    <div>
                        <p className="section-label">
                            SEARCH RESULTS
                        </p>

                        <h2>
                            {query.trim()
                                ? `Products matching "${query}"`
                                : "Find a product to track"}
                        </h2>
                    </div>

                    {products.length > 0 && (
                        <span className="result-count">
                            {products.length} results
                        </span>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    query.trim() &&
                    products.length === 0 && (
                        <div className="empty-state">
                            No products found.
                        </div>
                    )}

                {/* SELECTED PRODUCT DETAILS */}

                {selectedProduct && (
                    <section className="product-details">
                        <div className="details-header">
                            <div>
                                <p className="section-label">
                                    SELECTED PRODUCT
                                </p>

                                <h2>
                                    {selectedProduct.name}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="close-details"
                                onClick={
                                    closeProductDetails
                                }
                            >
                                Close
                            </button>
                        </div>

                        {detailsLoading && (
                            <div className="empty-state">
                                Loading product options...
                            </div>
                        )}

                        {productDetails && (
                            <div className="options-panel">
                                <p className="option-axis">
                                    Choose{" "}
                                    {
                                        productDetails.optionAxis
                                    }
                                </p>

                                <div className="option-grid">
                                    {productDetails.options.map(
                                        (option) => (
                                            <button
                                                type="button"
                                                key={option.id}
                                                className={`option-card ${
                                                    selectedOption?.id ===
                                                    option.id
                                                        ? "option-card-selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setSelectedOption(
                                                        option
                                                    )
                                                }
                                            >
                                                <span>
                                                    {
                                                        option.label
                                                    }
                                                </span>

                                                <small>
                                                    {
                                                        option.id
                                                    }
                                                </small>
                                            </button>
                                        )
                                    )}
                                </div>

                                {selectedOption && (
                                    <>
                                        <p className="selected-option-text">
                                            Selected:{" "}
                                            <strong>
                                                {
                                                    selectedOption.label
                                                }
                                            </strong>
                                        </p>

                                        <div className="track-option-area">
                                            <button
                                                type="button"
                                                className="track-option-button"
                                                onClick={
                                                    trackSelectedOption
                                                }
                                                disabled={
                                                    tracking
                                                }
                                            >
                                                {tracking
                                                    ? "Adding..."
                                                    : "Track This Option"}
                                            </button>

                                            {trackingMessage && (
                                                <p className="tracking-success">
                                                    {
                                                        trackingMessage
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* PRODUCT CARDS */}

                <div className="product-grid">
                    {products.map((product) => (
                        <article
                            className="product-card"
                            key={product.id}
                        >
                            <div className="product-card-top">
                                <span className="product-category">
                                    {product.category}
                                </span>

                                <span className="product-id">
                                    #{product.id}
                                </span>
                            </div>

                            <h3>{product.name}</h3>

                            <p className="product-brand">
                                {product.brand}
                            </p>

                            <p className="product-description">
                                {product.description}
                            </p>

                            <div className="product-footer">
                                <span>
                                    {product.sku}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        selectProduct(
                                            product
                                        )
                                    }
                                >
                                    Select
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default App;