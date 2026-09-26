import { supabase } from "../db/supabase.js";

export async function savePriceHistory(data) {
    const {
        trackedProductId,
        productId,
        productName,
        optionId,
        optionLabel,
        price,
        stock,
        outcome,
        attempts,
        errorMessage = null
    } = data;

    const { data: savedRecord, error } = await supabase
        .from("price_history")
        .insert({
            tracked_product_id: trackedProductId,
            store_product_id: productId,
            product_name: productName,
            option_id: optionId,
            option_label: optionLabel,
            price,
            stock,
            outcome,
            attempts,
            error_message: errorMessage
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return savedRecord;
}

export async function getPriceHistory(trackedProductId) {
    const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("tracked_product_id", trackedProductId)
        .order("scraped_at", {
            ascending: true
        });

    if (error) {
        throw error;
    }

    return data;
}

export async function getAllPriceHistory() {
    const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .order("scraped_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}