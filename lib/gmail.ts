// Gmail REST API helpers — no SDK, uses fetch directly.
// All functions that call Gmail take an access token so callers control auth.

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  body: string;
  isFromJo: boolean;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  from?: string;
}

// ─── Token management ─────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: creds } = await supabase
    .from("gmail_credentials")
    .select("*")
    .eq("id", 1)
    .single();

  if (!creds?.refresh_token) throw new Error("Gmail not connected");

  // Return cached token if still valid (5-min buffer)
  if (
    creds.access_token &&
    creds.token_expiry &&
    new Date(creds.token_expiry) > new Date(Date.now() + 5 * 60 * 1000)
  ) {
    return creds.access_token as string;
  }

  // Refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: creds.refresh_token as string,
      grant_type: "refresh_token",
    }),
  });

  const tokens = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${tokens.error}`);

  const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from("gmail_credentials")
    .update({
      access_token: tokens.access_token,
      token_expiry: expiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return tokens.access_token as string;
}

// ─── Parsing helpers ───────────────────────────────────────────────────────

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

function decodeB64(str: string): string {
  return Buffer.from(
    str.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");
}

function extractBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: unknown[];
}): string {
  function find(
    part: { mimeType?: string; body?: { data?: string }; parts?: unknown[] },
    mime: string
  ): string | null {
    if (part.mimeType === mime && part.body?.data) return decodeB64(part.body.data);
    if (part.parts) {
      for (const p of part.parts as typeof part[]) {
        const hit = find(p, mime);
        if (hit) return hit;
      }
    }
    return null;
  }
  const html = find(payload, "text/html");
  if (html) return stripHtml(html);
  return find(payload, "text/plain") ?? "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Thread fetch ──────────────────────────────────────────────────────────

export async function getThread(
  accessToken: string,
  threadId: string,
  joEmail?: string
): Promise<GmailMessage[]> {
  const res = await fetch(
    `${GMAIL_API}/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch Gmail thread");

  const data = await res.json();
  // Fall back to env var if not passed, but prefer the DB-stored email
  const senderEmail = (joEmail ?? process.env.GMAIL_USER ?? "").toLowerCase();

  return (data.messages ?? []).map(
    (msg: {
      id: string;
      threadId: string;
      snippet: string;
      payload?: { headers?: Array<{ name: string; value: string }>; mimeType?: string; body?: { data?: string }; parts?: unknown[] };
    }) => {
      const headers = msg.payload?.headers ?? [];
      const from = getHeader(headers, "From");
      return {
        id: msg.id,
        threadId: msg.threadId,
        from,
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
        body: msg.payload ? extractBody(msg.payload) : msg.snippet,
        isFromJo: from.toLowerCase().includes(senderEmail),
      };
    }
  );
}

// ─── Thread search ─────────────────────────────────────────────────────────

export async function searchThreadForOrder(
  accessToken: string,
  referenceNumber: string,
): Promise<string | null> {
  const q = encodeURIComponent(`subject:${referenceNumber}`);
  const res = await fetch(
    `${GMAIL_API}/users/me/threads?q=${q}&maxResults=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.threads as Array<{ id: string }> | undefined)?.[0]?.id ?? null;
}

// ─── Send email ────────────────────────────────────────────────────────────

export async function sendEmail(
  accessToken: string,
  params: SendEmailParams
): Promise<{ threadId: string; messageId: string }> {
  const from = params.from ?? process.env.GMAIL_USER ?? "";

  const headerLines = [
    `From: ${from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
  ];
  if (params.inReplyTo) headerLines.push(`In-Reply-To: ${params.inReplyTo}`);
  if (params.references) headerLines.push(`References: ${params.references}`);

  const raw = [...headerLines, "", params.htmlBody].join("\r\n");
  const encoded = Buffer.from(raw).toString("base64url");

  const body: { raw: string; threadId?: string } = { raw: encoded };
  if (params.threadId) body.threadId = params.threadId;

  const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      `Gmail send failed: ${(err as { error?: { message?: string } }).error?.message ?? "unknown"}`
    );
  }

  const result = await res.json();
  return { threadId: result.threadId as string, messageId: result.id as string };
}
