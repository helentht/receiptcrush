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
CRITICAL RULE FOR QUANTITIES: If a row indicates multiple quantities of the same item (for example: "2 x 2530 = 5060" or "Tendon 2点 5060" or "Lychee peach ¥2,600 3点 ¥7,800"), you MUST split them into separate individual items in the JSON array based on the quantity. For example, if there are 3 Lychee peaches at 2,600 each, create 3 separate JSON objects for "Lychee peach (1 of 3)", "Lychee peach (2 of 3)", and "Lychee peach (3 of 3)", each with a price of 2600. DO NOT just list it once. DO NOT put the combined total. It is strictly required to split them out row by row so that different people can claim their individual portions.
Detect the currency of the receipt (e.g., "USD", "HKD", "JPY", "EUR"). Be extremely careful with the "$" sign: look for contextual clues like address, store name (e.g. Hong Kong stores), or explicit "HK$" or "HKD" indicators to correctly distinguish HKD from USD. DO NOT convert the prices yourself, extract the exact prices written on the receipt.
Also, search the receipt for the printed date of the transaction and format it as "YYYY-MM-DD" (e.g., "2024-03-15").

Return ONLY a valid JSON object with the following structure:
{
  "currency": "JPY",
  "date": "2024-03-15",
  "items": [
    {
      "item_name": "Tendon (1 of 2)",
      "price": 2530
    },
    {
      "item_name": "Tendon (2 of 2)",
      "price": 2530
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
        date?: string;
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
            date: parsed.date,
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
      const receiptDate =
        parsedData.date || new Date().toISOString().split("T")[0]; // Fallback to today if not found

      if (finalCurrency !== baseCurrency) {
        try {
          console.log(
            `Fetching historical exchange rate for ${finalCurrency} to ${baseCurrency} on date: ${receiptDate}...`,
          );
          // Try Frankfurter API first for historical daily rates (supports major currencies USD, JPY, EUR, etc.)
          const frankfurterRes = await fetch(
            `https://api.frankfurter.app/${receiptDate}?from=${finalCurrency}&to=${baseCurrency}`,
          );

          if (frankfurterRes.ok) {
            const frankfurterData = await frankfurterRes.json();
            if (
              frankfurterData &&
              frankfurterData.rates &&
              frankfurterData.rates[baseCurrency]
            ) {
              exchangeRate = frankfurterData.rates[baseCurrency];
              console.log(
                `Historical rate found: 1 ${finalCurrency} = ${exchangeRate} ${baseCurrency} on ${receiptDate}`,
              );
            } else {
              throw new Error("Frankfurter payload missing rates.");
            }
          } else {
            throw new Error(
              "Frankfurter API failed or currency string unsupported.",
            );
          }
        } catch (histErr) {
          console.log(
            `Historical rate fetch failed (${(histErr as Error).message}), attempting fallback to latest open.er-api.com...`,
          );
          try {
            // Using a free open exchange rate API (latest rates)
            const rateRes = await fetch(
              `https://open.er-api.com/v6/latest/${finalCurrency}`,
            );
            const rateData = await rateRes.json();
            if (rateData && rateData.rates && rateData.rates[baseCurrency]) {
              exchangeRate = rateData.rates[baseCurrency];
              console.log(
                `Latest exchange rate fallback found: 1 ${finalCurrency} = ${exchangeRate} ${baseCurrency}`,
              );
            }
          } catch (rateErr) {
            console.error(
              "Failed to fetch exchange rate entirely, falling back to 1.0",
              rateErr,
            );
          }
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
