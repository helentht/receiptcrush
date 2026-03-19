"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Participant } from "./ExpenseAssignment";
import { ArrowRight, Loader2, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

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
  const [rawItems, setRawItems] = useState<Item[]>([]);
  const [rawReceipts, setRawReceipts] = useState<Receipt[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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

      if (!receiptsData || !itemsData) {
        setLoading(false);
        return;
      }

      setRawItems(itemsData);
      setRawReceipts(receiptsData);

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
                rawReceipts.find(r => r.id === item.receipt_id)?.uploader_id === s.to
            );

            const isExpanded = expandedRow === idx;

            return (
              <div key={idx} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm">
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
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
                  </div>
                </div>

                {/* Details Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-100/50 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      What {fromP.display_name} owes for:
                    </h4>
                    {debtorItems.length > 0 ? (
                      <div className="space-y-2">
                        {debtorItems.map(item => {
                          const receipt = rawReceipts.find(r => r.id === item.receipt_id);
                          const paidBy = getParticipant(receipt?.uploader_id || "")?.display_name || "Someone";
                          const splitPrice = item.price / (item.assigned_to?.length || 1);
                          return (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <div className="flex flex-col">
                                <span className="text-gray-800">{item.item_name}</span>
                                <span className="text-xs text-gray-400">pd by {paidBy} • split by {item.assigned_to?.length}</span>
                              </div>
                              <span className="font-medium text-gray-700">${splitPrice.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No specific assigned items found (debt may be from manual adjustments or net rounding).</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
