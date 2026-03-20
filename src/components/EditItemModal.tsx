"use client";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export function EditItemModal({
  item,
  receipt,
  isOpen,
  onClose,
  onSave,
}: {
  item: { id: string; item_name: string; price: number } | null;
  receipt: { id: string; currency?: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newPrice: number) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.item_name || "");
      setPrice(item.price ? item.price.toString() : "0");
    }
  }, [item]);

  if (!isOpen || !item || !receipt) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Edit Item Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
             <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-100 border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none rounded-xl text-gray-900" placeholder="E.g., Chicken Rice" />
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price ({receipt.currency})</label>
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-gray-100 border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none rounded-xl text-gray-900 font-medium" placeholder="0.00" />
             </div>
          </div>

          <button
             onClick={() => {
                onSave(name, parseFloat(price) || 0);
                onClose();
             }}
             className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
             <Save className="w-5 h-5" />
             Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}