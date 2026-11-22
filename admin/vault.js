// Username + password sign-in for a site with no server.
// The GitHub token is encrypted with the username and password and kept in this browser only.
// Nothing secret is in the repository, so there is nothing for anyone to download and crack.

const KEY = 'site-editor-vault';
const ITERATIONS = 600000;

const toB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const cleanUser = (user) => user.trim().toLowerCase();

async function deriveKey(user, password, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${cleanUser(user)}\n${password}`), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function stored() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export const hasVault = () => !!stored();

export async function seal(user, password, token) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(user, password, salt);
  const box = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
  localStorage.setItem(KEY, JSON.stringify({ salt: toB64(salt), iv: toB64(iv), box: toB64(box) }));
}

// Returns the token, or throws when the username or password is wrong.
export async function unseal(user, password) {
  const v = stored();
  try {
    const key = await deriveKey(user, password, fromB64(v.salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(v.iv) }, key, fromB64(v.box));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Wrong username or password.');
  }
}

export function forget() {
  localStorage.removeItem(KEY);
}
