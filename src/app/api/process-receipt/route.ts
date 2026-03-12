import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { receiptId } = await req.json();

    if (!receiptId) {
      return NextResponse.json(
        { error: "No receipt ID provided" },
        { status: 400 },
      );
    }

    // Initialize admin Supabase client to bypass RLS if needed, or use regular client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Update status to 'processing'
    await supabase
      .from("receipts")
      .update({ processing_status: "processing" })
      .eq("id", receiptId);

    console.log(`Began processing receipt: ${receiptId}`);

    try {
      // Fetch receipt to get the image URL and the session's base currency
      const { data: receipt } = await supabase
        .from("receipts")
        .select("*, sessions(base_currency)")
        .eq("id", receiptId)
        .single();

      if (!receipt || !receipt.image_url) {
        throw new Error("Receipt or image URL not found");
      }

      const baseCurrency = receipt.sessions?.base_currency || "HKD";

      // Initialize OpenRouter Client
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const prompt = `You are a helpful receipt-parsing assistant. Examine this receipt image.
Identify all the purchased line items. Ignore subtotal, tax, tip, and total. 
Also, try to detect the currency of the receipt (e.g., "USD", "JPY", "EUR").

Return ONLY a valid JSON object with the following structure:
{
  "currency": "JPY",
  "items": [
    {
      "item_name": "Exact description (clean up abbreviations if needed)",
      "price": 300
    }
  ]
}

Output strictly just the JSON object. No markdown formatting block, no other text!`;

      console.log("Calling Vision AI via OpenRouter...");
      const response = await openai.chat.completions.create({
        // Swapped to Qwen 3 M-VL 8B Instruct - fast, no strict geo-blocking, robust vision
        model: "qwen/qwen3-vl-8b-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: receipt.image_url } },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "{}";
      console.log("AI response received:");
      console.log(content);

      let parsedData: {
        currency?: string;
        items: { item_name: string; price: number; [key: string]: unknown }[];
      } = { currency: baseCurrency, items: [] };
      try {
        // Safely strip any potential markdown wrappers
        const cleanedContent = content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(cleanedContent);
        // Handle case where AI might still return an array directly despite instructions
        if (Array.isArray(parsed)) {
          parsedData = { currency: baseCurrency, items: parsed };
        } else {
          parsedData = {
            currency: parsed.currency || baseCurrency,
            items: parsed.items || [],
          };
        }
      } catch (e) {
        console.error("Failed to parse JSON from AI", e, "\nContent:", content);
        throw new Error("Invalid output format from AI");
      }

      // Automatically convert to base currency if it's different
      let exchangeRate = 1.0;
      const finalCurrency = parsedData.currency || baseCurrency;
      if (finalCurrency !== baseCurrency) {
        try {
          console.log(
            `Fetching exchange rate for ${finalCurrency} to ${baseCurrency}...`,
          );
          // Using a free open exchange rate API
          const rateRes = await fetch(
            `https://open.er-api.com/v6/latest/${finalCurrency}`,
          );
          const rateData = await rateRes.json();
          if (rateData && rateData.rates && rateData.rates[baseCurrency]) {
            exchangeRate = rateData.rates[baseCurrency];
            console.log(
              `Exchange rate found: 1 ${finalCurrency} = ${exchangeRate} ${baseCurrency}`,
            );
          }
        } catch (rateErr) {
          console.error(
            "Failed to fetch exchange rate, falling back to 1.0",
            rateErr,
          );
        }
      }

      // Use Serper to find thumbnails
      console.log("Fetching item thumbnails via Serper...");
      const finalItems = await Promise.all(
        parsedData.items.map(async (item) => {
          let item_image_url = null;

          if (process.env.SERPER_API_KEY) {
            try {
              // Add context to the search query to prevent weird generic matches like "hot spring filter"
              // e.g., instead of "Hot spring tax product", we search "Hot spring tax receipt item" or just the item itself
              const searchQuery = `${item.item_name} generic icon`;
              const serperRes = await fetch(
                "https://google.serper.dev/images",
                {
                  method: "POST",
                  headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    q: searchQuery,
                    num: 1,
                  }),
                },
              );

              if (serperRes.ok) {
                const serperData = await serperRes.json();
                if (serperData.images && serperData.images.length > 0) {
                  // Fall back through the images if the first one fails
                  item_image_url = serperData.images[0].imageUrl;
                }
              }
            } catch (serperErr) {
              console.error(
                "Serper API error for item:",
                item.item_name,
                serperErr,
              );
            }
          }

          // Multiply the original price by the exchange rate to store the equivalent in the base currency
          const convertedPrice = item.price * exchangeRate;

          return {
            receipt_id: receiptId,
            item_name: item.item_name,
            original_item_name: item.item_name,
            price: Number(convertedPrice.toFixed(2)), // Round to 2 decimals
            item_image_url: item_image_url,
            quantity: 1,
          };
        }),
      );

      // Save items to Supabase
      if (finalItems.length > 0) {
        const { error: insertError } = await supabase
          .from("items")
          .insert(finalItems);
        if (insertError) {
          console.error("Error inserting items:", insertError);
        }
      }

      // Update receipt status with the detected currency and exchange rate
      await supabase
        .from("receipts")
        .update({
          processing_status: "completed",
          currency: finalCurrency,
          exchange_rate_to_base: exchangeRate,
          parsed_data: finalItems,
        })
        .eq("id", receiptId);

      console.log(
        `Successfully completed processing receipt: ${receiptId}! Inserted ${finalItems.length} items.`,
      );

      return NextResponse.json({
        success: true,
        message: "Processing completed",
        items: finalItems,
      });
    } catch (err) {
      console.error("Background processing failed:", err);
      // Let's send the detailed error back so we can see what actually failed
      const errorMessage = err instanceof Error ? err.message : String(err);

      await supabase
        .from("receipts")
        .update({ processing_status: "failed" })
        .eq("id", receiptId);

      return NextResponse.json(
        { error: "Failed to process receipt", details: errorMessage },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in process-receipt route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
