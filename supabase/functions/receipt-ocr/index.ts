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

// The model has no idea what "today" is, so a receipt whose year is smudged or
// missing used to get a hallucinated year (usually a training-era one). We pass
// the user's local date in and make every date rule relative to it. Day-first is
// the default reading because Malaysian receipts are overwhelmingly DD/MM/YYYY.
function buildSystemPrompt(today: string): string {
  return `You are a world-class receipt processing expert. Your task is to accurately extract information from a receipt image and provide it in a structured JSON format.

Today's date is ${today} (the user's local date). Use it to resolve every ambiguity about dates.

Date rules (follow these exactly):
- transaction_date must be ISO format YYYY-MM-DD.
- Read the date printed on the receipt. Do NOT guess it from the look of the receipt, and never invent a date.
- Receipts use day-first formats. Read DD/MM/YY and DD-MM-YYYY as day, then month. Only read a date as month-first when the first number is greater than 12 (e.g. 12/25/2025), or when the month is spelled out.
- A 2-digit year belongs to the century that puts the receipt on or before today's date.
- If the year is missing entirely, pick the year that makes the date fall on or before today's date and within the last 12 months.
- The transaction date can never be in the future relative to today's date. If your reading lands after today, you misread it — re-read it.
- Prefer the date printed next to the payment/transaction time or the receipt/bill number over dates in a footer, promotion, warranty, or expiry line.
- If no date is legible, use an empty string. An empty string is always better than a guess.

Other rules:
- Return ONLY a JSON object, no prose and no markdown code fences.
- transaction_time is the time printed on the receipt, in 24-hour HH:MM:SS. Use an empty string if there is none.
- total_amount is the final amount paid (grand total after tax/rounding), as a plain number with no currency symbol.
- Amounts are in the receipt's currency (often Malaysian Ringgit, RM); never include the symbol.
- If a field is not legible, use an empty string for text or 0 for numbers.

Return the data using exactly this JSON schema:

${JSON.stringify(RECEIPT_SCHEMA, null, 2)}`;
}

const USER_PROMPT = 'Please extract the information from this receipt image.';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB (matches the FastAPI service limit)

// ── Date normalisation ───────────────────────────────────────────────────────
// The model still returns the odd malformed or impossible date, so we never
// trust it blindly: anything we can't resolve to a real, non-future day within
// the last few years is dropped (empty string) rather than passed on. An empty
// date leaves the form on "Today", a far better default than a wrong year
// silently filing the transaction months into the past.

const MAX_AGE_DAYS = 365 * 3;

function isValidYMD(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/**
 * Coerce whatever the model returned into a trustworthy YYYY-MM-DD, or ''.
 * Accepts ISO plus the day-first slash/dot forms receipts actually print, and
 * rejects future dates and anything implausibly old.
 */
function normalizeDate(raw: unknown, today: string): string {
  if (typeof raw !== 'string') return '';
  const text = raw.trim();
  if (!text) return '';

  const [ty, tm, td] = today.split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);

  let y = 0;
  let m = 0;
  let d = 0;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else {
    // Day-first fallback for models that ignored the ISO instruction.
    const dayFirst = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (!dayFirst) return '';
    d = Number(dayFirst[1]);
    m = Number(dayFirst[2]);
    y = Number(dayFirst[3]);
    // Only swap when the first number can't be a month — otherwise day-first stands.
    if (m > 12 && d <= 12) {
      const t = d;
      d = m;
      m = t;
    }
    if (y < 100) y += y > 70 ? 1900 : 2000;
  }

  if (!isValidYMD(y, m, d)) return '';

  // A future date is always a misread. Try the day/month swap once — e.g. 04/11
  // read as 11 April when 4 November is the reading that fits.
  if (Date.UTC(y, m - 1, d) > todayMs) {
    if (isValidYMD(y, d, m) && Date.UTC(y, d - 1, m) <= todayMs) {
      const t = m;
      m = d;
      d = t;
    } else {
      return '';
    }
  }
  if ((todayMs - Date.UTC(y, m - 1, d)) / 86400000 > MAX_AGE_DAYS) return '';

  return pad(y, 4) + '-' + pad(m, 2) + '-' + pad(d, 2);
}

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

    const { image, today: clientToday } = await req.json().catch(() => ({ image: undefined }));
    if (typeof image !== 'string' || image.length === 0) {
      return json({ error: 'Missing "image" (base64-encoded receipt)' }, 400);
    }

    // Reject oversized images up front (base64 is ~4/3 the raw byte size).
    if ((image.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return json({ error: 'Image too large. Max 5 MB allowed.' }, 413);
    }

    // The client sends its own local date so the model resolves ambiguous years
    // the way the user's phone sees them; UTC is only a fallback.
    const today = typeof clientToday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientToday)
      ? clientToday
      : new Date().toISOString().slice(0, 10);

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
          { role: 'system', content: buildSystemPrompt(today) },
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

    parsed.transaction_date = normalizeDate(parsed.transaction_date, today);

    return json(parsed, 200);
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
});
