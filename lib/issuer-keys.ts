import { getSigningKey, publicKeyOf, type PublicKey } from "ledgeroot";

/**
 * The issuer identities this dashboard can check receipt attribution against.
 * Ledgeroot's pay path signs receipts with the configured signing key, so the
 * dashboard verifies with the matching public key. Empty when no key is
 * configured, which reports attribution as incomplete rather than passing a
 * check that never ran.
 */
export function issuerKeys(): PublicKey[] {
  const key = getSigningKey();
  return key ? [publicKeyOf(key)] : [];
}
