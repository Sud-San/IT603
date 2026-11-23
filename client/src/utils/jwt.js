/**
 * Utilities for decoding and validating JWT tokens in the browser
 */

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Failed to parse JWT payload:', err);
    return null;
  }
}

export function isTokenValid(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  // exp is in seconds, Date.now() is in milliseconds
  const isNotExpired = payload.exp * 1000 > Date.now();
  return isNotExpired;
}

export function getTokenExpirationTime(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return null;
  return new Date(payload.exp * 1000);
}
