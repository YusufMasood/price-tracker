import axios from "axios";

const INE_BASE_URL = "https://demo.inelabteamdev.com";

export async function getListings(page = 1, limit = 20) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await axios.get(
                `${INE_BASE_URL}/api/v2/listings`,
                {
                    params: {
                        page,
                        limit
                    }
                }
            );

            return response.data;

        } catch (error) {
            const status = error.response?.status;

            console.log(
                `INE listings request failed: page=${page}, attempt=${attempt}/${maxAttempts}, status=${status}`
            );

            if (attempt === maxAttempts) {
                throw error;
            }

            const delay = 1000 * 2 ** (attempt - 1);

            console.log(`Retrying page ${page} in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export async function getProduct(productId) {
    const response = await axios.get(
        `${INE_BASE_URL}/api/v2/items/${productId}`
    );

    return response.data;
}