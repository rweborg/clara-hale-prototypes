import { HttpError } from './http.js';

/** Shown when production has no Resend key. Never pair this with a sign-in link. */
export const EMAIL_UNAVAILABLE = "Sign-in by email isn't available yet. You can keep playing — your progress is saved on this device.";

/**
 * Send a magic-link email through Resend's HTTPS API.
 * Railway blocks outbound SMTP on Hobby and Free, so this is HTTP only.
 * With no API key, non-production returns the link to the caller (and logs it).
 * Production never includes the link in the response or the logs.
 *
 * @param {{ to: string, url: string, config: object, fetchImpl?: typeof fetch }} opts
 */
export async function sendMagicLink({ to, url, config, fetchImpl = globalThis.fetch }) {
  if (!config.resendApiKey) {
    if (config.production) {
      throw new HttpError(503, EMAIL_UNAVAILABLE);
    }
    console.log(`[case-desk] dev magic link for ${to}: ${url}`);
    return { delivered: 'dev', devLink: url };
  }

  const text = [
    'Sign in to The Case Desk.',
    '',
    'Open this link in the same browser where you asked to sign in. It works once, and only for the next 15 minutes.',
    '',
    url,
    '',
    'If you did not ask for this, you can ignore it.',
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;background:#ECE7DF;font-family:Georgia,serif;color:#1D1B18">
  <div style="max-width:480px;margin:0 auto;padding:32px 20px">
    <p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#1F5E4E">The Case Desk</p>
    <h1 style="font-size:28px;line-height:1.2;margin:8px 0 12px">Your sign-in link</h1>
    <p style="font-size:16px;line-height:1.5">Open this on the same browser where you asked to sign in. It works once and expires in 15 minutes.</p>
    <p style="margin:24px 0"><a href="${url.replace(/"/g, '')}" style="display:inline-block;background:#1F5E4E;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Sign in</a></p>
    <p style="font-size:13px;color:#6B645B">If you did not ask for this, you can ignore the email.</p>
  </div></body></html>`;

  const payload = {
    from: config.emailFrom,
    to: [to],
    subject: 'Your sign-in link for The Case Desk',
    text,
    html,
  };
  if (config.emailReplyTo) payload.reply_to = config.emailReplyTo;

  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[case-desk] resend request failed');
    throw new HttpError(502, 'Could not send the sign-in email. Try again in a minute.');
  }

  if (!response.ok) {
    console.error(`[case-desk] resend rejected the message (${response.status})`);
    throw new HttpError(502, 'Could not send the sign-in email. Try again in a minute.');
  }
  console.log('[case-desk] magic link sent');
  return { delivered: 'resend' };
}
