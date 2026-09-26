import { savePriceHistory } from "./services/priceHistory.service.js";

const result = await savePriceHistory({
    trackedProductId: 4,
    productId: 2884,
    productName: "Solvane Vlog Camera Arc",
    optionId: "o1",
    optionLabel: "Body only",
    price: 73976,
    stock: 0,
    outcome: "success",
    attempts: 2
});

console.log("Saved price history:");
console.log(result);