import { customAlphabet } from 'nanoid';

export function generateReferralCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const custom = customAlphabet(alphabet, 5);
  const code = custom();
  return `REF-${code}`;
}
