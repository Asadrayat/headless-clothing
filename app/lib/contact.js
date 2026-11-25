/**
 * Contact form values shared by the page (browser) and contact.server.js.
 * Anything that needs secrets belongs in contact.server.js instead.
 */

export const CONTACT_TOPICS = [
  {value: 'order', label: 'Order status or delivery'},
  {value: 'returns', label: 'Returns and exchanges'},
  {value: 'product', label: 'Product or sizing question'},
  {value: 'other', label: 'Something else'},
];

export const MESSAGE_MAX_LENGTH = 2000;

/** Name of the hidden field that only bots fill in. */
export const HONEYPOT_FIELD = 'company';
