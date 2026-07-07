// CORS headers inlined (rather than imported from ../_shared) so this function
// is a single self-contained file — easiest to paste into the Supabase dashboard.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Deno port of the `receipt_ocr` Python package (providers.py + prompts.py +
// parsers.py). Takes a base64 receipt image, asks an OpenAI vision model to
// extract structured fields, and returns parsed JSON. The OpenAI key lives in
// Supabase secrets — the mobile client never sees it.

// The JSON shape we ask the model to return. Kept flat + minimal: Flowe only
// prefills amount / name / date from this (category & account stay user-driven).
const RECEIPT_SCHEMA = {
  merchant_name: 'string',
  merchant_address: 'string',
  transaction_date: 'string (YYYY-MM-DD)',
  transaction_time: 'string (HH:MM:SS)',
  total_amount: 'number',
  line_items: [
    {
      item_name: 'string',
      item_quantity: 'number',
      item_price: 'number',
    },
  ],
};

const SYSTEM_PROMPT = `You are a world-class receipt processing expert. Your task is to accurately extract information from a receipt image and provide it in a structured JSON format.

Rules:
- Return ONLY a JSON object, no prose and no markdown code fences.
- transaction_date must be ISO format YYYY-MM-DD. If the year is missing, assume the current year. If no date is legible, use an empty string.
- total_amount is the final amount paid (grand total after tax/rounding), as a plain number with no currency symbol.
- Amounts are in the receipt's currency (often Malaysian Ringgit, RM); never include the symbol.
- If a field is not legible, use an empty string for text or 0 for numbers.

Return the data using exactly this JSON schema:

${JSON.stringify(RECEIPT_SCHEMA, null, 2)}`;

const USER_PROMPT = 'Please extract the information from this receipt image.';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (matches the FastAPI service limit)

// Strip an optional ```json … ``` fence and parse. Mirrors ReceiptParser.parse.
function parseModelJson(content: string): Record<string, unknown> {
  let text = content.trim();
  if (text.startsWith('```json')) text = text.slice(7);
  else if (text.startsWith('```')) text = text.slice(3);
  if (text.endsWith('```')) text = text.slice(0, -3);
  return JSON.parse(text.trim());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'OCR is not configured (missing OPENAI_API_KEY)' }, 500);

    const { image } = await req.json().catch(() => ({ image: undefined }));
    if (typeof image !== 'string' || image.length === 0) {
      return json({ error: 'Missing "image" (base64-encoded receipt)' }, 400);
    }

    // Reject oversized images up front (base64 is ~4/3 the raw byte size).
    if ((image.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return json({ error: 'Image too large. Max 5 MB allowed.' }, 413);
    }

    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const baseUrl = (Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1').replace(/\/$/, '');

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `LLM request failed (${res.status})`, detail }, 502);
    }

    const completion = await res.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return json({ error: 'LLM returned no content' }, 502);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = parseModelJson(content);
    } catch {
      return json({ error: "The LLM's response was not valid JSON" }, 502);
    }

    return json(parsed, 200);
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
