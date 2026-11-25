/**
 * Contact form handling: validation, spam filtering and delivery through
 * Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * The `.server` suffix keeps this module, and the API key it reads, out of
 * the browser bundle.
 *
 * Environment variables (Worker secrets in production, .env locally):
 * - RESEND_API_KEY      required, from resend.com → API Keys
 * - CONTACT_TO_EMAIL    required, the inbox that receives messages
 * - CONTACT_FROM_EMAIL  optional, a sender on a domain verified in Resend,
 *                       like "Store <hello@yourdomain.com>". Defaults to
 *                       Resend's test sender, which only delivers to the
 *                       email address of your Resend account.
 */

import {
  CONTACT_TOPICS,
  HONEYPOT_FIELD,
  MESSAGE_MAX_LENGTH,
} from '~/lib/contact';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM = 'Storefront contact form <onboarding@resend.dev>';

/**
 * @param {FormData} formData
 * @return {{values: ContactValues; errors: ContactErrors | null; isSpam: boolean}}
 */
export function parseContactForm(formData) {
  const read = (key) => String(formData.get(key) ?? '').trim();

  const values = {
    name: read('name'),
    email: read('email'),
    topic: read('topic'),
    orderNumber: read('orderNumber'),
    message: read('message'),
  };

  /** @type {ContactErrors} */
  const errors = {};
  if (!values.name) errors.name = 'Enter your name.';
  else if (values.name.length > 100)
    errors.name = 'Keep your name under 100 characters.';

  if (!values.email) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(values.email) || values.email.length > 254)
    errors.email = 'Enter an email address like name@example.com.';

  if (!CONTACT_TOPICS.some((topic) => topic.value === values.topic))
    errors.topic = 'Choose what your message is about.';

  if (values.orderNumber.length > 30)
    errors.orderNumber = 'Order numbers are shorter than that.';

  if (values.message.length < 10)
    errors.message = 'Tell us a little more (at least 10 characters).';
  else if (values.message.length > MESSAGE_MAX_LENGTH)
    errors.message = `Keep your message under ${MESSAGE_MAX_LENGTH} characters.`;

  return {
    values,
    errors: Object.keys(errors).length ? errors : null,
    isSpam: read(HONEYPOT_FIELD) !== '',
  };
}

/**
 * Sends the message to the store's inbox. Replying to the email replies to
 * the customer.
 * @param {ContactValues} values
 * @param {{env: Env; shopName?: string; request: Request}} options
 * @return {Promise<{ok: true} | {ok: false; reason: 'not_configured' | 'send_failed'}>}
 */
export async function sendContactEmail(values, {env, shopName, request}) {
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    if (import.meta.env.DEV) {
      // Lets the form be tested locally before Resend is set up.
      console.warn(
        '[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set; message not sent:',
        values,
      );
      return {ok: true};
    }
    console.error('[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set.');
    return {ok: false, reason: 'not_configured'};
  }

  const topicLabel =
    CONTACT_TOPICS.find((topic) => topic.value === values.topic)?.label ??
    values.topic;
  const store = shopName || 'Storefront';
  const subject = `[${store}] ${topicLabel}: ${values.name}`;

  const rows = [
    ['Name', values.name],
    ['Email', values.email],
    ['Topic', topicLabel],
    ['Order number', values.orderNumber || '—'],
    ['Page', new URL(request.url).origin],
  ];

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    values.message,
  ].join('\n');

  const html = `
    <table cellpadding="4" style="font-family:system-ui,sans-serif;font-size:14px">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="color:#55607a">${label}</td><td>${escapeHtml(value)}</td></tr>`,
        )
        .join('')}
    </table>
    <p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(values.message)}</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
        to: to.split(',').map((address) => address.trim()),
        reply_to: values.email,
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      console.error(
        `[contact] Resend responded ${response.status}:`,
        await response.text(),
      );
      return {ok: false, reason: 'send_failed'};
    }

    return {ok: true};
  } catch (error) {
    console.error('[contact] Could not reach Resend:', error);
    return {ok: false, reason: 'send_failed'};
  }
}

/** @param {string} value */
function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * @typedef {{
 *   name: string;
 *   email: string;
 *   topic: string;
 *   orderNumber: string;
 *   message: string;
 * }} ContactValues
 * @typedef {Partial<Record<keyof ContactValues, string>>} ContactErrors
 */
