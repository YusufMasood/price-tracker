import { chromium } from "playwright";

const INE_BASE_URL = "https://demo.inelabteamdev.com";

const CONSENT_POLL_MS = 500;
const CONSENT_WAIT_MS = 8000;
const PRICE_ENABLE_WAIT_MS = 10000;
const QUOTE_WAIT_MS = 10000;
const INSPECTION_WAIT_MS = 5000;

async function handleCookieConsent(page) {
    const overlay = page.locator(".consent-scrim");

    if (await overlay.count() === 0) {
        return false;
    }

    if (!(await overlay.first().isVisible().catch(() => false))) {
        return false;
    }

    const buttons = await overlay.locator("button").evaluateAll(
        elements =>
            elements.map(element => ({
                text: element.innerText.trim(),
                disabled: element.disabled
            }))
    );

    console.log("Consent buttons:", buttons);

    const rejectButton = overlay.locator("button").filter({
        hasText: /^REJECT$/i
    }).first();

    const allowButton = overlay.locator("button").filter({
        hasText: /^ALLOW$/i
    }).first();

    if (
        await rejectButton.count() &&
        await rejectButton.isVisible().catch(() => false)
    ) {
        console.log("Rejecting cookies...");
        await rejectButton.click();
    } else if (
        await allowButton.count() &&
        await allowButton.isVisible().catch(() => false)
    ) {
        console.log("Accepting cookies...");
        await allowButton.click();
    } else {
        console.log(
            "Consent overlay detected, but no usable button found."
        );

        return false;
    }

    await overlay.waitFor({
        state: "hidden",
        timeout: 5000
    }).catch(() => {});

    await page.waitForTimeout(300);

    console.log("Cookie consent handled.");

    return true;
}

async function waitForCookieConsent(page) {
    const deadline = Date.now() + CONSENT_WAIT_MS;

    while (Date.now() < deadline) {
        const handled = await handleCookieConsent(page);

        if (handled) {
            return true;
        }

        await page.waitForTimeout(CONSENT_POLL_MS);
    }

    return false;
}

function normalizePrice(text) {
    if (!text) {
        return null;
    }

    const normalized = text
        .replace(/[０-９]/g, digit =>
            String.fromCharCode(
                digit.charCodeAt(0) - 0xfee0
            )
        )
        .replace(/[₹,\s]/g, "");

    const value = Number(normalized);

    return Number.isFinite(value)
        ? value
        : null;
}

async function moveAcrossPricePanel(page, panel) {
    const box = await panel.boundingBox();

    if (!box || box.width < 20 || box.height < 20) {
        throw new Error("Price panel position is unavailable");
    }

    const left =
        box.x + Math.min(10, box.width / 4);

    const right =
        box.x + box.width - Math.min(10, box.width / 4);

    const top =
        box.y + Math.min(10, box.height / 4);

    const bottom =
        box.y + box.height - Math.min(10, box.height / 4);

    const centerX =
        box.x + box.width / 2;

    const centerY =
        box.y + box.height / 2;

    const points = [
        [left, top],
        [centerX, top],
        [right, top],
        [left, centerY],
        [centerX, centerY],
        [right, centerY],
        [left, bottom],
        [centerX, bottom],
        [right, bottom]
    ];

    for (const [x, y] of points) {
        await page.mouse.move(x, y);
        await page.waitForTimeout(150);
    }

    await page.mouse.move(centerX, centerY);
}

export async function scrapePrice(   trackedProductId,
    productId,
    productName,
    optionId,
    optionLabel) {
    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    try {
        console.log(`Opening product ${productId}...`);

        await page.goto(
            `${INE_BASE_URL}/item/${productId}`,
            {
                waitUntil: "domcontentloaded",
                timeout: 30000
            }
        );

        await page.waitForTimeout(3000);

        await waitForCookieConsent(page);

        // ---------------------------------------
        // Select product option
        // ---------------------------------------

        if (optionLabel) {
            const optionButton = page.getByRole("button", {
                name: optionLabel,
                exact: true
            });

            await optionButton.waitFor({
                state: "visible",
                timeout: 10000
            });

            console.log(
                `Selecting option: ${optionLabel}`
            );

            await handleCookieConsent(page);

            await optionButton.click();

            await page.waitForTimeout(500);

            await handleCookieConsent(page);
        }

        // ---------------------------------------
        // Locate price button
        // ---------------------------------------

        const priceButton = page.locator("button").filter({
            hasText: /CHECK\s+TODAY.?S\s+PRICE/i
        }).first();

        console.log(
            "Price button count:",
            await priceButton.count()
        );

        console.log(
            "Visible buttons:",
            await page.locator("button").evaluateAll(
                elements =>
                    elements
                        .map(element => ({
                            text: element.innerText.trim(),
                            disabled: element.disabled
                        }))
                        .filter(button => button.text)
            )
        );

        const pricePanel = page.locator(
            ".offer-panel"
        ).first();

        await priceButton.waitFor({
            state: "visible",
            timeout: 15000
        });

        await pricePanel.waitFor({
            state: "visible",
            timeout: 10000
        });

        // ---------------------------------------
        // Unlock price button
        // ---------------------------------------

        const deadline =
            Date.now() + PRICE_ENABLE_WAIT_MS;

        let enabled = false;

        while (
            Date.now() < deadline &&
            !enabled
        ) {
            await handleCookieConsent(page);

            await moveAcrossPricePanel(
                page,
                pricePanel
            );

            await page.waitForTimeout(300);

            enabled =
                await priceButton
                    .isEnabled()
                    .catch(() => false);

            if (!enabled) {
                await page.waitForTimeout(400);
            }
        }

        const buttonsAfterInteraction =
            await page.locator("button").evaluateAll(
                elements =>
                    elements.map(element => ({
                        text: element.innerText.trim(),
                        disabled: element.disabled,
                        ariaLabel:
                            element.getAttribute("aria-label"),
                        className:
                            element.className
                    }))
            );

        console.log(
            "Buttons after price panel interaction:",
            buttonsAfterInteraction
        );

        if (!enabled) {
            throw new Error(
                `Price button did not enable within ${PRICE_ENABLE_WAIT_MS}ms`
            );
        }

        // ---------------------------------------
        // Click price button
        // ---------------------------------------

        console.log(
            "Price button enabled. Clicking..."
        );

        await handleCookieConsent(page);

        await priceButton.click();

        console.log(
            "Price button clicked."
        );

        // ---------------------------------------
        // Wait for quote to render
        // ---------------------------------------

        console.log(
            `Waiting ${QUOTE_WAIT_MS}ms for quote...`
        );

        await page.waitForTimeout(
            QUOTE_WAIT_MS
        );

        // Consent can appear asynchronously
        // after the price request starts.
        await handleCookieConsent(page);

        // ---------------------------------------
        // Inspect actual rendered quote DOM
        // ---------------------------------------

        console.log("\n----- QUOTE ELEMENTS -----");

        const quoteElements = await page.locator(
            ".offer-panel *"
        ).evaluateAll(elements =>
            elements
                .map(element => ({
                    tag: element.tagName,
                    text: element.innerText?.trim() || "",
                    className:
                        typeof element.className === "string"
                            ? element.className
                            : "",
                    ariaLabel:
                        element.getAttribute("aria-label"),
                    dataTestId:
                        element.getAttribute("data-testid")
                }))
                .filter(element => element.text)
        );

        console.log(quoteElements);

        console.log(
            "----- END QUOTE ELEMENTS -----\n"
        );

        // ---------------------------------------
        // Also print complete offer-panel text
        // ---------------------------------------

        const offerPanelText =
            await pricePanel.innerText().catch(() => "");

        console.log(
            "----- OFFER PANEL TEXT -----"
        );

        console.log(offerPanelText);

        console.log(
            "----- END OFFER PANEL TEXT -----\n"
        );

        // ---------------------------------------
// Extract structured quote data
// ---------------------------------------

const displayedPriceElement =
    page.locator(".price-value").first();

const stockElement =
    page.locator(".avail-pill").first();

const displayedPriceText =
    await displayedPriceElement.innerText();

const stockText =
    await stockElement.innerText().catch(() => "");

const price =
    normalizePrice(displayedPriceText);

const stockMatch =
    stockText.match(/(\d[\d,]*)/);

const stock =
    stockMatch
        ? Number(stockMatch[1].replace(/,/g, ""))
        : 0;


        const attemptText =
    await page.locator(".offer-foot span").first().innerText()
        .catch(() => "");

const attemptMatch =
    attemptText.match(/(\d+)\s+attempt/i);

const attempts =
    attemptMatch
        ? Number(attemptMatch[1])
        : 1;

const result = {
    productId,
    productName,
    optionId,
    optionLabel,
    price,
    attempts,
    stock,
    outcome: "success"
};

console.log("\n----- STRUCTURED RESULT -----");
console.log(result);
console.log("----- END STRUCTURED RESULT -----\n");


return result;

} catch (error) {

    console.error(
        `SCRAPE FAILED: ${productName} | ${optionLabel}`,
        error.message
    );

    throw error;

} finally {
    await browser.close();
}
}

