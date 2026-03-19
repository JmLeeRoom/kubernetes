/**
 * Client-side JWT helpers.
 * These parse tokens for display purposes only – real verification
 * happens server-side in the API gateway.
 */

interface JwtPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  groups?: string[];
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenRemainingTime(token: string): number {
  const payload = decodeToken(token);
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}
