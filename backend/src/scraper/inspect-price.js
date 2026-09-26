import { chromium } from "playwright";

const browser = await chromium.launch({
    headless: false
});

const page = await browser.newPage();

await page.goto("https://demo.inelabteamdev.com/item/2884", {
    waitUntil: "domcontentloaded"
});

console.log("Page loaded.");

await page.waitForTimeout(3000);

console.log("\n--- BUTTONS ON PAGE ---");

const buttons = await page.locator("button").evaluateAll((elements) =>
    elements.map((element) => ({
        text: element.innerText.trim(),
        disabled: element.disabled,
        ariaLabel: element.getAttribute("aria-label")
    }))
);

console.log(buttons);

console.log("\n--- PAGE TEXT ---");

const bodyText = await page.locator("body").innerText();

console.log(bodyText);

await page.waitForTimeout(5000);

console.log("\n--- PRICE LOCKED ELEMENTS ---");

const lockedElements = await page.locator("body *").evaluateAll((elements) =>
    elements
        .filter((element) =>
            element.textContent?.trim().toLowerCase().includes("price locked")
        )
        .map((element) => ({
            tag: element.tagName,
            className: element.className,
            text: element.textContent?.trim()
        }))
);

console.log(lockedElements);



console.log("\n--- BUTTONS AFTER HOVER ---");

const buttonsAfterHover = await page.locator("button").evaluateAll((elements) =>
    elements.map((element) => ({
        text: element.innerText.trim(),
        disabled: element.disabled,
        ariaLabel: element.getAttribute("aria-label"),
        className: element.className
    }))
);

console.log(buttonsAfterHover);

console.log("\n--- PRICE AREA AFTER HOVER ---");

const priceElementsAfterHover = await page.locator(
    "body *"
).evaluateAll((elements) =>
    elements
        .filter((element) =>
            element.textContent?.trim().toLowerCase().includes("check today's price")
        )
        .map((element) => ({
            tag: element.tagName,
            className: element.className,
            text: element.textContent?.trim()
        }))
);

console.log(priceElementsAfterHover);

await page.waitForTimeout(5000);

await browser.close();