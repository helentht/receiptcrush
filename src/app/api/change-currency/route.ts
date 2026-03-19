import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { sessionId, newCurrency } = await req.json();

    if (!sessionId || !newCurrency) {
      return NextResponse.json(
        { error: "Missing sessionId or newCurrency" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get session info
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const oldCurrency = session.base_currency;
    if (oldCurrency === newCurrency) {
      return NextResponse.json({ success: true, message: "Currency already matches" });
    }

    // 2. Update the session's base currency
    await supabase
      .from("sessions")
      .update({ base_currency: newCurrency })
      .eq("id", sessionId);

    // 3. Fetch all receipts for this session
    const { data: receipts } = await supabase
      .from("receipts")
      .select("id, currency, exchange_rate_to_base, uploaded_at, parsed_data")
      .eq("session_id", sessionId);

    if (receipts && receipts.length > 0) {
      for (const receipt of receipts) {
        const originalCurrency = receipt.currency || oldCurrency;
        const oldRate = receipt.exchange_rate_to_base || 1.0;
        let newRate = 1.0;

        if (originalCurrency !== newCurrency) {
            // Get date string YYYY-MM-DD
            const receiptDate = new Date(receipt.uploaded_at).toISOString().split("T")[0];
            try {
              const frankfurterRes = await fetch(
                `https://api.frankfurter.app/${receiptDate}?from=${originalCurrency}&to=${newCurrency}`,
              );
              
              if (frankfurterRes.ok) {
                const frankfurterData = await frankfurterRes.json();
                if (frankfurterData?.rates?.[newCurrency]) {
                  newRate = frankfurterData.rates[newCurrency];
                }
              } else {
                // Fallback to latest
                const rateRes = await fetch(
                  `https://open.er-api.com/v6/latest/${originalCurrency}`,
                );
                const rateData = await rateRes.json();
                if (rateData?.rates?.[newCurrency]) {
                  newRate = rateData.rates[newCurrency];
                }
              }
            } catch (err) {
              console.error("Failed fetching exchange rate for room currency change", err);
            }
        }

        // Update receipt's new exchange rate
        await supabase
          .from("receipts")
          .update({ exchange_rate_to_base: newRate })
          .eq("id", receipt.id);

        // Fetch all items for this receipt to recalculate their converted price
        const { data: items } = await supabase
          .from("items")
          .select("id, price")
          .eq("receipt_id", receipt.id);

        if (items && items.length > 0) {
          for (const item of items) {
            // Reverse-calculate original price, then apply new rate
            // oldRate is the rate from originalCurrency -> oldCurrency
            const originalPrice = item.price / oldRate;
            const newConvertedPrice = originalPrice * newRate;
            
            await supabase
              .from("items")
              .update({ price: Number(newConvertedPrice.toFixed(2)) })
              .eq("id", item.id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully changed room currency to ${newCurrency} and recalculated past receipts.`,
    });
  } catch (error: any) {
    console.error("Error changing room currency:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
