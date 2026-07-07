// Structured data returned by the `receipt-ocr` Edge Function (OpenAI vision
// extraction). Every field is best-effort — the model returns "" / 0 / [] for
// anything it can't read, so treat them all as potentially empty.

export interface ReceiptLineItem {
  item_name: string;
  item_quantity: number;
  item_price: number;
}

export interface ReceiptData {
  merchant_name: string;
  merchant_address: string;
  transaction_date: string; // ISO YYYY-MM-DD, or "" when unreadable
  transaction_time: string; // HH:MM:SS, or ""
  total_amount: number;
  line_items: ReceiptLineItem[];
}
