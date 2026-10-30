/** Server-side configuration shared by API routes. */

export const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mailfortempusage@gmail.com').toLowerCase().trim();

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  '340953449815-qatnff0fgk0ee9jel8nk8o7tk1mlj4dp.apps.googleusercontent.com';

export function isMasterAdminEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().trim() === MASTER_ADMIN_EMAIL;
}
