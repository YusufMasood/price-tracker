import { chromium } from "playwright";

const browser = await chromium.launch({
    headless: false
});

const page = await browser.newPage();

await page.mouse.move(400, 300);
await page.waitForTimeout(1000);

await page.goto("https://demo.inelabteamdev.com/item/2884", {
    waitUntil: "domcontentloaded"
});

console.log("Page loaded.");

const priceButton = page.getByRole("button", {
    name: "Check today's price",
    exact: true
});

for (let i = 1; i <= 30; i++) {
    const disabled = await priceButton.isDisabled();

    console.log(
        `${i}: Check today's price disabled = ${disabled}`
    );

    if (!disabled) {
        console.log("BUTTON ENABLED");
        break;
    }

    await page.waitForTimeout(1000);
}

console.log("Finished observing button.");

await page.waitForTimeout(3000);

await browser.close();