"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  sessionId: string;
  participantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualExpenseModal({
  sessionId,
  participantId,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name || !price) return;
    setIsSubmitting(true);

    try {
      // 1. Create a logical "receipt" to hold the expense
      const { data: receiptData, error: dbError } = await supabase
        .from("receipts")
        .insert({
          session_id: sessionId,
          uploader_id: participantId,
          processing_status: "done", // Mark as done immediately
          currency: "USD", // Assumes base currency initially
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Add the item to this receipt
      const { error: itemError } = await supabase.from("items").insert({
        receipt_id: receiptData.id,
        item_name: name.trim(),
        price: parseFloat(price),
      });

      if (itemError) throw itemError;

      onSuccess();
      setName("");
      setPrice("");
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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold text-gray-900"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
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
