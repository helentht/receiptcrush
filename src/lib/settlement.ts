export interface Item {
  id: string;
  receipt_id: string;
  item_name: string;
  price: number;
  assigned_to: string[] | null;
}

export interface Receipt {
  id: string;
  uploader_id: string;
  exchange_rate_to_base: number;
  cc_fee_percentage?: number;
}

export interface SettlementRecord {
  id: string;
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
  status: "pending" | "completed";
  created_at?: string;
}

export interface Participant {
  id: string;
}

export interface CalculatedSettlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateSettlements(
  items: Item[],
  receipts: Receipt[],
  participants: Participant[],
  completedSettlements: SettlementRecord[] = [],
): {
  calculatedSettlements: CalculatedSettlement[];
  userBalances: Record<string, number>;
} {
  // Calculate initial balances: total paid - total owed
  const userBalances: Record<string, number> = {};
  participants.forEach((p) => {
    userBalances[p.id] = 0;
  });

  // Map receipts
  const receiptMap = new Map<string, Receipt>();
  receipts.forEach((r) => receiptMap.set(r.id, r));

  items.forEach((item) => {
    const receipt = receiptMap.get(item.receipt_id);
    if (!receipt) return;

    const feeMultiplier = 1 + (receipt.cc_fee_percentage || 0) / 100;
    const actualPrice = item.price * feeMultiplier;

    if (
      receipt.uploader_id &&
      userBalances[receipt.uploader_id] !== undefined
    ) {
      userBalances[receipt.uploader_id] += actualPrice;
    }

    if (item.assigned_to && item.assigned_to.length > 0) {
      const splitAmount = actualPrice / item.assigned_to.length;
      item.assigned_to.forEach((userId) => {
        if (userBalances[userId] !== undefined) {
          userBalances[userId] -= splitAmount;
        }
      });
    } else {
      if (
        receipt.uploader_id &&
        userBalances[receipt.uploader_id] !== undefined
      ) {
        userBalances[receipt.uploader_id] -= actualPrice;
      }
    }
  });

  completedSettlements.forEach((s) => {
    if (
      userBalances[s.from_participant_id] !== undefined &&
      userBalances[s.to_participant_id] !== undefined
    ) {
      userBalances[s.from_participant_id] += Number(s.amount);
      userBalances[s.to_participant_id] -= Number(s.amount);
    }
  });

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(userBalances).forEach(([id, bal]) => {
    const roundedBal = Math.round(bal * 100) / 100;
    if (roundedBal <= -0.01) debtors.push({ id, amount: Math.abs(roundedBal) });
    else if (roundedBal >= 0.01) creditors.push({ id, amount: roundedBal });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const calculatedSettlements: CalculatedSettlement[] = [];
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

  return { calculatedSettlements, userBalances };
}
