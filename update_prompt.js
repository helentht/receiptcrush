const fs = require('fs');
const file = 'src/app/api/process-receipt/route.ts';
let content = fs.readFileSync(file, 'utf8');

const newPrompt = `You are a helpful receipt-parsing assistant. Examine this receipt image.
Identify all the purchased line items. Ignore subtotal, tax, tip, and total. 
CRITICAL RULE FOR QUANTITIES: If a row indicates multiple quantities of the same item (for example: "2 x 2530 = 5060" or "Tendon 2点 5060"), you MUST split them into separate individual items in the JSON array. For example, if there are 2 Tendons, create 2 separate JSON objects for "Tendon", each with a price of 2530. DO NOT group them into a single item with a combined total. This is strictly required so that different people can claim individual portions of a shared order.
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

// Note: escaping regex special characters
content = content.replace(/const prompt \= `You are a helpful receipt\-parsing assistant\.[\s\S]*?Output strictly just the JSON object\. No markdown formatting block, no other text!`;/, 'const prompt = `' + newPrompt + '`;');

fs.writeFileSync(file, content);
