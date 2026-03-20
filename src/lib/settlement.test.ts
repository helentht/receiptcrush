import { describe, it, expect } from "vitest";
import { calculateSettlements } from "./settlement";

describe("Debt Simplification Algorithm", () => {
  it("should split a simple $100 bill correctly", () => {
    const participants = [{ id: "alice" }, { id: "bob" }];
    const receipts = [
      {
        id: "r1",
        uploader_id: "alice",
        exchange_rate_to_base: 1,
        cc_fee_percentage: 0,
      },
    ];
    const items = [
      {
        id: "i1",
        receipt_id: "r1",
        item_name: "Dinner",
        price: 100,
        assigned_to: ["alice", "bob"],
      },
    ];

    const { calculatedSettlements, userBalances } = calculateSettlements(
      items,
      receipts,
      participants,
    );

    // Alice paid $100. Bob owes $50.
    // Balances: Alice: +$50, Bob: -$50
    expect(userBalances["alice"]).toBe(50);
    expect(userBalances["bob"]).toBe(-50);

    expect(calculatedSettlements).toHaveLength(1);
    expect(calculatedSettlements[0]).toEqual({
      from: "bob",
      to: "alice",
      amount: 50,
    });
  });

  it("should handle credit card fee percentages", () => {
    const participants = [{ id: "alice" }, { id: "bob" }];
    const receipts = [
      {
        id: "r1",
        uploader_id: "alice",
        exchange_rate_to_base: 1,
        cc_fee_percentage: 3,
      }, // 3% fee
    ];
    const items = [
      {
        id: "i1",
        receipt_id: "r1",
        item_name: "Dinner",
        price: 100,
        assigned_to: ["alice", "bob"],
      },
    ];

    const { calculatedSettlements, userBalances } = calculateSettlements(
      items,
      receipts,
      participants,
    );

    // Total actual price = $103
    // Alice paid $103, owes $51.5 (balance = +51.5)
    // Bob owes $51.5 (balance = -51.5)

    expect(userBalances["alice"]).toBe(51.5);
    expect(userBalances["bob"]).toBe(-51.5);

    expect(calculatedSettlements[0]).toEqual({
      from: "bob",
      to: "alice",
      amount: 51.5,
    });
  });

  it("should handle cyclic debts automatically", () => {
    // A spent $30 for B
    // B spent $30 for C
    // C spent $30 for A
    // Net should be 0 settlements since everything cancels out.
    const participants = [{ id: "A" }, { id: "B" }, { id: "C" }];

    const receipts = [
      { id: "r1", uploader_id: "A", exchange_rate_to_base: 1 },
      { id: "r2", uploader_id: "B", exchange_rate_to_base: 1 },
      { id: "r3", uploader_id: "C", exchange_rate_to_base: 1 },
    ];

    const items = [
      {
        id: "i1",
        receipt_id: "r1",
        item_name: "Lunch",
        price: 30,
        assigned_to: ["B"],
      },
      {
        id: "i2",
        receipt_id: "r2",
        item_name: "Dinner",
        price: 30,
        assigned_to: ["C"],
      },
      {
        id: "i3",
        receipt_id: "r3",
        item_name: "Breakfast",
        price: 30,
        assigned_to: ["A"],
      },
    ];

    const { calculatedSettlements } = calculateSettlements(
      items,
      receipts,
      participants,
    );
    expect(calculatedSettlements).toHaveLength(0);
  });
});
