import { env } from '../config/env.js';

/** Sends a transactional email via Resend. If no RESEND_API_KEY is configured
 *  it no-ops (logs only) so the app works fine in dev / before email is set up. */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!env.email.apiKey) {
    console.log(`[email skipped — set RESEND_API_KEY] to=${opts.to} subject="${opts.subject}"`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.email.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.email.from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) console.error('email send failed:', res.status, await res.text());
  } catch (err) {
    console.error('email error:', (err as Error).message);
  }
}

/** Minimal branded wrapper for transactional emails. */
export function emailLayout(title: string, body: string): string {
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 4px">AgroJatra ERP</h1>
    <h2 style="font-size:16px;font-weight:600;margin:16px 0 8px">${title}</h2>
    <div style="font-size:14px;line-height:1.6;color:#334155">${body}</div>
    <p style="margin-top:24px;font-size:12px;color:#94a3b8">— AgroJatra ERP</p>
  </div>`;
}
