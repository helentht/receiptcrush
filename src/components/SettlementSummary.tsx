"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Participant } from "./ExpenseAssignment";
import { ArrowRight, Loader2, DollarSign, Check } from "lucide-react";

interface Item {
  id: string;
  receipt_id: string;
  item_name: string;
  price: number;
  assigned_to: string[] | null;
}

interface Receipt {
  id: string;
  uploader_id: string;
  exchange_rate_to_base: number;
}

interface SettlementRecord {
  id: string;
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
  status: "pending" | "completed";
  created_at: string;
}

export function SettlementSummary({
  sessionId,
  participants,
  refreshTrigger = 0,
}: {
  sessionId: string;
  participants: Participant[];
  myParticipantId: string;
  refreshTrigger?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<
    { from: string; to: string; amount: number }[]
  >([]);
  const [completedSettlements, setCompletedSettlements] = useState<
    SettlementRecord[]
  >([]);
  const [rawItems, setRawItems] = useState<Item[]>([]);
  const [rawReceipts, setRawReceipts] = useState<Receipt[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Receipts (to know who paid)
      const { data: receiptsData } = await supabase
        .from("receipts")
        .select("id, uploader_id, exchange_rate_to_base")
        .eq("session_id", sessionId);

      if (!receiptsData || receiptsData.length === 0) {
        setLoading(false);
        return;
      }

      const receiptIds = receiptsData.map((r) => r.id);

      // 2. Fetch Items ONLY for these receipts
      const { data: itemsData } = (await supabase
        .from("items")
        .select("*")
        .in("receipt_id", receiptIds)) as {
        data: Item[] | null;
      };

      // 3. Fetch completed settlements (payments already made)
      const { data: settlementsData } = await supabase
        .from("settlements")
        .select("*")
        .eq("session_id", sessionId)
        .eq("status", "completed");

      if (!receiptsData || !itemsData) {
        setLoading(false);
        return;
      }

      setRawItems(itemsData);
      setRawReceipts(receiptsData);
      if (settlementsData)
        setCompletedSettlements(settlementsData as SettlementRecord[]);

      // Calculate initial balances: total paid - total owed
      const userBalances: Record<string, number> = {};
      participants.forEach((p) => {
        userBalances[p.id] = 0;
      });

      // Map receipts
      const receiptMap = new Map<string, Receipt>();
      receiptsData.forEach((r) => receiptMap.set(r.id, r));

      itemsData.forEach((item) => {
        const receipt = receiptMap.get(item.receipt_id);
        if (!receipt) return;

        // The item.price is already converted and saved in the DB in the base currency,
        // so we DO NOT multiply by the receipt's exchange rate here!
        const actualPrice = item.price;

        // Uploader paid for this item
        if (
          receipt.uploader_id &&
          userBalances[receipt.uploader_id] !== undefined
        ) {
          userBalances[receipt.uploader_id] += actualPrice;
        }

        // Assigned participants owe for this item
        if (item.assigned_to && item.assigned_to.length > 0) {
          const splitAmount = actualPrice / item.assigned_to.length;
          item.assigned_to.forEach((userId) => {
            if (userBalances[userId] !== undefined) {
              userBalances[userId] -= splitAmount;
            }
          });
        } else {
          // If no one is assigned, the uploader defaults as the owner (net zero)
          if (
            receipt.uploader_id &&
            userBalances[receipt.uploader_id] !== undefined
          ) {
            userBalances[receipt.uploader_id] -= actualPrice;
          }
        }
      });

      // Apply completed settlements
      if (settlementsData) {
        settlementsData.forEach((s) => {
          if (
            userBalances[s.from_participant_id] !== undefined &&
            userBalances[s.to_participant_id] !== undefined
          ) {
            userBalances[s.from_participant_id] += Number(s.amount);
            userBalances[s.to_participant_id] -= Number(s.amount);
          }
        });
      }

      // Debt Simplification Algorithm
      const debtors: { id: string; amount: number }[] = [];
      const creditors: { id: string; amount: number }[] = [];

      Object.entries(userBalances).forEach(([id, bal]) => {
        // Round to 2 decimal places to avoid float precision issues
        const roundedBal = Math.round(bal * 100) / 100;

        if (roundedBal <= -0.01)
          debtors.push({ id, amount: Math.abs(roundedBal) });
        else if (roundedBal >= 0.01) creditors.push({ id, amount: roundedBal });
      });

      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);

      const calculatedSettlements: {
        from: string;
        to: string;
        amount: number;
      }[] = [];

      let dIndex = 0;
      let cIndex = 0;

      while (dIndex < debtors.length && cIndex < creditors.length) {
        const debtor = debtors[dIndex];
        const creditor = creditors[cIndex];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0) {
          const finalAmount = parseFloat(amount.toFixed(2));
          if (finalAmount > 0) {
            calculatedSettlements.push({
              from: debtor.id,
              to: creditor.id,
              amount: finalAmount,
            });
          }
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) dIndex++;
        if (creditor.amount < 0.01) cIndex++;
      }

      setSettlements(calculatedSettlements);
      setLoading(false);
    };

    fetchData();

    // Re-calculate when things change
    const channel = supabase
      .channel("settlement_calc")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        fetchData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        fetchData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements" },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, participants, supabase, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleMarkAsPaid = async (
    idx: number,
    s: { from: string; to: string; amount: number },
  ) => {
    setIsPaying(idx);

    // Insert a new completed settlement record
    const { error } = await supabase.from("settlements").insert({
      session_id: sessionId,
      from_participant_id: s.from,
      to_participant_id: s.to,
      amount: s.amount,
      status: "completed",
    });

    if (error) {
      console.error("Failed to mark as paid:", error);
    }

    setIsPaying(null);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 w-full">
      <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
        <DollarSign className="w-5 h-5 text-indigo-600" />
        Settlement Plan
      </h2>

      {settlements.length === 0 ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-2xl">
          No pending debts! Everyone is settled up. 🎉
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((s, idx) => {
            const fromP = getParticipant(s.from);
            const toP = getParticipant(s.to);
            if (!fromP || !toP) return null;

            // Find items this debtor consumed that they didn't pay for, where the creditor paid
            const debtorItems = rawItems.filter(
              (item) =>
                item.assigned_to?.includes(s.from) &&
                rawReceipts.find((r) => r.id === item.receipt_id)
                  ?.uploader_id === s.to,
            );

            const isExpanded = expandedRow === idx;

            return (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedRow(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800">
                      {fromP.display_name}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div className="font-semibold text-gray-800">
                      {toP.display_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-indigo-600">
                      ${s.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Details Modal Popup */}
                {isExpanded && (
                  <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setExpandedRow(null)}
                  >
                    <div
                      className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-indigo-600">
                            {fromP.display_name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {toP.display_name}
                          </span>
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(null);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="p-4 overflow-y-auto space-y-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          What {fromP.display_name} owes for:
                        </h4>
                        {debtorItems.length > 0 ? (
                          <div className="space-y-3">
                            {debtorItems.map((item) => {
                              const receipt = rawReceipts.find(
                                (r) => r.id === item.receipt_id,
                              );
                              const paidBy =
                                getParticipant(receipt?.uploader_id || "")
                                  ?.display_name || "Someone";
                              const splitPrice =
                                item.price / (item.assigned_to?.length || 1);
                              return (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-gray-100"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-gray-800 font-medium">
                                      {item.item_name}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-0.5">
                                      pd by {paidBy} • split by{" "}
                                      {item.assigned_to?.length}
                                    </span>
                                  </div>
                                  <span className="font-bold text-gray-700">
                                    ${splitPrice.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-xl border border-gray-100 placeholder:">
                            No specific assigned items found (debt may be from
                            manual adjustments or net rounding).
                          </div>
                        )}
                      </div>

                      <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div className="text-lg font-bold text-indigo-600">
                          Total: ${s.amount.toFixed(2)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(idx, s);
                          }}
                          disabled={isPaying === idx}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                        >
                          {isPaying === idx ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                          Mark as Paid
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Settlements History */}
      {completedSettlements.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 text-sm text-gray-500 uppercase tracking-wider">
            Settlement History
          </h3>
          <div className="space-y-3">
            {completedSettlements
              // Sort newest first
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .map((cs) => {
                const fromP = getParticipant(cs.from_participant_id);
                const toP = getParticipant(cs.to_participant_id);
                if (!fromP || !toP) return null;

                return (
                  <div
                    key={cs.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 gap-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-600 line-through decoration-gray-400">
                        {fromP.display_name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-gray-600 line-through decoration-gray-400">
                        {toP.display_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-400 line-through decoration-gray-400">
                        ${Number(cs.amount).toFixed(2)}
                      </span>
                      <span
                        className="text-xs text-gray-400 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-100"
                        title={formatDateTime(cs.created_at)}
                      >
                        <Check className="w-3 h-3 text-green-500" /> Paid
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
