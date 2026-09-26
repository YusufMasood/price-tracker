import { supabase } from "../db/supabase.js";

export async function addTrackedProduct(product) {
    const { data: existingProduct, error: existingError } =
        await supabase
            .from("tracked_products")
            .select("*")
            .eq("store_product_id", product.productId)
            .eq("option_id", product.optionId)
            .maybeSingle();

    if (existingError) {
        throw existingError;
    }

    if (existingProduct) {
        return existingProduct;
    }

    const { data, error } = await supabase
        .from("tracked_products")
        .insert({
            store_product_id: product.productId,
            product_name: product.productName,
            option_id: product.optionId,
            option_label: product.optionLabel
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getTrackedProducts() {
    const { data, error } = await supabase
        .from("tracked_products")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        throw error;
    }

    return data;
}