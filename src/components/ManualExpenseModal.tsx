"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  sessionId: string;
  participantId: string;
  roomCurrency: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "HKD", "SGD", "TWD", "AUD", "CAD"];

export function ManualExpenseModal({
  sessionId,
  participantId,
  roomCurrency,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(roomCurrency);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setCurrency(roomCurrency);
    }
  }, [isOpen, roomCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !price) return;
    setIsSubmitting(true);

    try {
      let exchangeRate = 1.0;
      const targetCurrency = currency.toUpperCase();
      const baseRoomCurrency = roomCurrency.toUpperCase();

      if (targetCurrency !== baseRoomCurrency) {
        try {
          const rateRes = await fetch(`https://open.er-api.com/v6/latest/${targetCurrency}`);
          const rateData = await rateRes.json();
          if (rateData && rateData.rates && rateData.rates[baseRoomCurrency]) {
            exchangeRate = rateData.rates[baseRoomCurrency];
          } else {
            console.warn("Failed to get exchange rate, defaulting to 1");
          }
        } catch (e) {
          console.warn("API request for exchange rate failed, defaulting to 1", e);
        }
      }

      const originalPrice = parseFloat(price);
      const convertedPrice = originalPrice * exchangeRate;

      // 1. Create a logical "receipt" to hold the expense
      const { data: receiptData, error: dbError } = await supabase
        .from("receipts")
        .insert({
          session_id: sessionId,
          uploader_id: participantId,
          processing_status: "completed", // Fixed from "done" (not in enum)
          currency: targetCurrency,
          exchange_rate_to_base: exchangeRate,
          image_url: "manual_entry", // Required column
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Add the item to this receipt
      const { error: itemError } = await supabase.from("items").insert({
        receipt_id: receiptData.id,
        item_name: name.trim(),
        price: Number(convertedPrice.toFixed(2)),
      });

      if (itemError) throw itemError;

      onSuccess();
      setName("");
      setPrice("");
      setCurrency(roomCurrency);
      onClose();
    } catch (error) {
      console.error("Failed to add manual expense", error);
      alert("Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Add Manual Expense</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Taxi, Tip, Coffee"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Amount
            </label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 outline-none"
              >
                {!COMMON_CURRENCIES.includes(roomCurrency) && (
                  <option value={roomCurrency}>{roomCurrency}</option>
                )}
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold text-gray-900"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            {currency !== roomCurrency && (
              <p className="text-xs text-gray-400 font-medium px-1 mt-1">
                Will be converted to {roomCurrency} automatically
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !price || isSubmitting}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:active:scale-100 text-white rounded-xl py-3 font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Add Expense"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
