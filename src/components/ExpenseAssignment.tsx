/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Image as ImageIcon,
  Trash2,
  Smile,
  Cat,
  Dog,
  Zap,
  Star,
  Heart,
  Rocket,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
export interface Participant {
  id: string;
  display_name: string;
  avatar_icon: string;
  avatar_color: string;
}

const AVATARS = {
  smile: Smile,
  cat: Cat,
  dog: Dog,
  zap: Zap,
  star: Star,
  heart: Heart,
  rocket: Rocket,
  user: User,
};
type AvatarKey = keyof typeof AVATARS;

interface Item {
  id: string;
  receipt_id: string;
  item_name: string;
  item_image_url: string;
  price: number;
  assigned_to: string[] | null;
}

interface Receipt {
  id: string;
  image_url: string;
  processing_status: string;
  currency: string;
  uploader_id: string;
  items: Item[];
}

const COLORS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export function ExpenseAssignment({
  sessionId,
  participants,
  myParticipantId,
  refreshTrigger = 0,
}: {
  sessionId: string;
  participants: Participant[];
  myParticipantId: string;
  refreshTrigger?: number;
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingPayerReceiptId, setEditingPayerReceiptId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchReceipts();

    // Subscribe to receipts and items changes (requires Supabase Realtime to be enabled on these tables)
    const rChannel = supabase
      .channel("receipts_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "receipts",
          filter: `session_id=eq.${sessionId}`,
        },
        fetchReceipts,
      )
      .subscribe();

    const iChannel = supabase
      .channel("items_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        fetchReceipts,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rChannel);
      supabase.removeChannel(iChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, supabase, refreshTrigger]);

  const fetchReceipts = async () => {
    const { data } = await supabase
      .from("receipts")
      .select(
        "id, image_url, processing_status, currency, uploader_id, items(id, receipt_id, item_name, item_image_url, price, assigned_to)",
      )
      .eq("session_id", sessionId)
      .order("uploaded_at", { ascending: false });

    if (data) {
      setReceipts(data as Receipt[]);
    }
  };

  const deleteReceipt = async (receiptId: string, imageUrl: string | null) => {
    if (!window.confirm("Are you sure you want to delete this receipt?"))
      return;

    // Optimistic update
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));

    // Delete image from storage
    if (imageUrl) {
      // imageUrl looks like: .../storage/v1/object/public/receipts/[sessionId]/[filename]
      const filePath = imageUrl.split("/receipts/").pop();
      if (filePath) {
        await supabase.storage.from("receipts").remove([filePath]);
      }
    }

    // Delete items first (in case cascade is not set), then receipt
    await supabase.from("items").delete().eq("receipt_id", receiptId);
    await supabase.from("receipts").delete().eq("id", receiptId);
  };

  const toggleAssignment = async (
    itemId: string,
    currentAssignedTo: string[] | null,
    participantId: string,
  ) => {
    let newAssignedTo = currentAssignedTo ? [...currentAssignedTo] : [];

    if (newAssignedTo.includes(participantId)) {
      newAssignedTo = newAssignedTo.filter((id) => id !== participantId);
    } else {
      newAssignedTo.push(participantId);
    }

    // Optimistic update locally
    setReceipts(
      receipts.map((r) => ({
        ...r,
        items: r.items.map((i) =>
          i.id === itemId ? { ...i, assigned_to: newAssignedTo } : i,
        ),
      })),
    );

    // Send to DB
    await supabase
      .from("items")
      .update({ assigned_to: newAssignedTo })
      .eq("id", itemId);
  };

  const handleChangePayer = async (receiptId: string, newUploaderId: string) => {
    // Optimistic update locally
    setReceipts(
      receipts.map((r) =>
        r.id === receiptId ? { ...r, uploader_id: newUploaderId } : r
      )
    );
    setEditingPayerReceiptId(null);

    const { error } = await supabase
      .from("receipts")
      .update({ uploader_id: newUploaderId })
      .eq("id", receiptId);

    if (error) {
      console.error("Error updating payer:", error);
      fetchReceipts();
    }
  };

  if (receipts.length === 0) return null;

  return (
    <div className="space-y-6 mb-32">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-3">
              <div 
                className={cn("w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center", receipt.image_url ? "cursor-pointer hover:opacity-80 transition-opacity" : "")}
                onClick={() => receipt.image_url && setSelectedImage(receipt.image_url)}
              >
                {receipt.image_url ? (
                  <img
                    src={receipt.image_url}
                    alt="Receipt Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="relative">
                <h3 
                  className="font-bold text-gray-900 text-sm flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => setEditingPayerReceiptId(editingPayerReceiptId === receipt.id ? null : receipt.id)}
                >
                  Paid by{" "}
                  {participants.find((p) => p.id === receipt.uploader_id)
                    ?.display_name || "Someone"}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </h3>
                {editingPayerReceiptId === receipt.id && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1">
                    {participants.map((p) => (
                      <button
                        key={p.id}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                          p.id === receipt.uploader_id ? "font-bold text-indigo-600 bg-indigo-50/50" : "text-gray-700"
                        )}
                        onClick={() => handleChangePayer(receipt.id, p.id)}
                      >
                        {p.display_name}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {receipt.processing_status === "processing"
                    ? "AI is reading..."
                    : receipt.processing_status === "failed"
                      ? "Failed to read"
                      : `${receipt.items?.length || 0} items`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {receipt.processing_status === "processing" && (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={() => deleteReceipt(receipt.id, receipt.image_url)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete receipt"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {receipt.items?.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm border-b-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.item_image_url ? (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm capitalize leading-tight">
                        {item.item_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-700 text-lg">
                      ${item.price}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-inner">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400 text-center mb-3">
                    Tap to Split Expense
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {participants.map((p) => {
                      const isAssigned = item.assigned_to?.includes(p.id);
                      const baseColor = COLORS[p.avatar_color] || "bg-gray-800";
                      const Icon = AVATARS[p.avatar_icon as AvatarKey] || User;

                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            toggleAssignment(item.id, item.assigned_to, p.id)
                          }
                          className={cn(
                            "group relative h-10 px-3 min-w-[3.5rem] rounded-xl flex items-center justify-center gap-1.5 text-white font-bold transition-all active:scale-90",
                            isAssigned
                              ? `${baseColor} shadow-md ring-2 ring-offset-1`
                              : "bg-gray-200 text-gray-400 hover:bg-gray-300",
                          )}
                        >
                          <span className="relative z-10 text-sm truncate max-w-[150px]">
                            {p.display_name}
                          </span>
                          <Icon className="w-4 h-4 relative z-10 opacity-90" />
                          {isAssigned && (
                            <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 duration-200 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
            {/* Close instruction */}
            <span className="absolute -top-8 text-white/70 text-sm font-medium">
              Tap anywhere to close
            </span>
            <img 
              src={selectedImage} 
              alt="Full Receipt" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Let users tap outside to close, but not the image itself if we wanted. Actually, tapping image to close is fine too!
            />
          </div>
        </div>
      )}
    </div>
  );
}
