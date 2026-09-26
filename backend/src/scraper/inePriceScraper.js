import { chromium } from "playwright";

const INE_BASE_URL = "https://demo.inelabteamdev.com";
const CONSENT_POLL_MS = 500;
const CONSENT_WAIT_MS = 8000;
const PRICE_ENABLE_WAIT_MS = 10000;

async function dismissCookieConsent(page) {
    const rejectButton = page.getByRole("button", {
        name: /^reject$/i,
        exact: true
    });
    const allowButton = page.getByRole("button", {
        name: /^allow$/i,
        exact: true
    });
    const deadline = Date.now() + CONSENT_WAIT_MS;

    // The consent UI is injected asynchronously on some page loads.
    while (Date.now() < deadline) {
        if (await rejectButton.isVisible().catch(() => false)) {
            console.log("Cookie consent appeared; rejecting cookies...");
            await rejectButton.click();
            await rejectButton.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
            return;
        }

        if (await allowButton.isVisible().catch(() => false)) {
            console.log("Cookie consent appeared; accepting cookies...");
            await allowButton.click();
            await allowButton.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
            return;
        }

        await page.waitForTimeout(CONSENT_POLL_MS);
    }

    console.log("No cookie consent popup appeared.");
}

async function moveAcrossPricePanel(page, panel) {
    const box = await panel.boundingBox();
    if (!box || box.width < 20 || box.height < 20) {
        throw new Error("Price panel position is unavailable");
    }

    const left = box.x + Math.min(10, box.width / 4);
    const right = box.x + box.width - Math.min(10, box.width / 4);
    const top = box.y + Math.min(10, box.height / 4);
    const bottom = box.y + box.height - Math.min(10, box.height / 4);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Use real pointer movement through the panel; the site's unlock behavior
    // is triggered by pointer events rather than a programmatic DOM event.
    for (const [x, y] of [
        [left, top], [centerX, top], [right, top],
        [left, centerY], [centerX, centerY], [right, centerY],
        [left, bottom], [centerX, bottom], [right, bottom]
    ]) {
        await page.mouse.move(x, y);
        await page.waitForTimeout(150);
    }

    await page.mouse.move(centerX, centerY);
}

export async function scrapePrice(productId, optionLabel) {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        console.log(`Opening product ${productId}...`);
        await page.goto(`${INE_BASE_URL}/item/${productId}`, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await dismissCookieConsent(page);

        if (optionLabel) {
            const optionButton = page.getByRole("button", {
                name: optionLabel,
                exact: true
            });
            await optionButton.waitFor({ state: "visible", timeout: 10000 });
            console.log(`Selecting option: ${optionLabel}`);
            await optionButton.click();
        }

        const priceButton = page.getByRole("button", {
            name: /check today's price/i
        });
        const pricePanel = page.locator(".offer-panel").first();

        await priceButton.waitFor({ state: "visible", timeout: 15000 });
        await pricePanel.waitFor({ state: "visible", timeout: 10000 });

        const deadline = Date.now() + PRICE_ENABLE_WAIT_MS;
        let enabled = false;
        while (Date.now() < deadline && !enabled) {
            // Re-query the live panel each round in case selecting an option
            // or the consent overlay caused the product area to re-render.
            await moveAcrossPricePanel(page, pricePanel);
            enabled = await priceButton.isEnabled().catch(() => false);
            if (!enabled) await page.waitForTimeout(400);
        }

        const buttons = await page.locator("button").evaluateAll(elements =>
            elements.map(element => ({
                text: element.innerText.trim(),
                disabled: element.disabled,
                ariaLabel: element.getAttribute("aria-label"),
                className: element.className
            }))
        );

        console.log("Buttons after price panel interaction:", buttons);
        if (!enabled) {
            throw new Error(`Price button did not enable within ${PRICE_ENABLE_WAIT_MS}ms`);
        }

        return await priceButton.innerText();
    } finally {
        await browser.close();
    }
}

await scrapePrice(2884, "Body only");
