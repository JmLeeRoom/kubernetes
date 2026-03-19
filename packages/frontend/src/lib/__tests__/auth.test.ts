import { describe, it, expect, vi, afterEach } from 'vitest';
import { decodeToken, isTokenExpired, getTokenRemainingTime } from '../auth';

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeToken', () => {
  it('returns parsed payload from a valid JWT', () => {
    const token = makeJwt({ sub: 'user-1', email: 'a@b.com', groups: ['admin'] });
    const result = decodeToken(token);
    expect(result).toEqual(
      expect.objectContaining({ sub: 'user-1', email: 'a@b.com', groups: ['admin'] })
    );
  });

  it('returns null for non-3-part strings', () => {
    expect(decodeToken('not.a.valid.jwt.token')).toBeNull();
    expect(decodeToken('single')).toBeNull();
    expect(decodeToken('')).toBeNull();
  });

  it('returns null when base64 payload is not valid JSON', () => {
    const token = `header.${btoa('not-json')}.sig`;
    expect(decodeToken(token)).toBeNull();
  });

  it('handles base64url characters (- and _)', () => {
    const payload = { sub: 'user-2', data: 'special chars: + / =' };
    const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
    const header = btoa(JSON.stringify({ alg: 'RS256' }));
    const token = `${header}.${body}.sig`;
    const result = decodeToken(token);
    expect(result?.sub).toBe('user-2');
  });
});

describe('isTokenExpired', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false for a token with exp far in the future', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ sub: 'u', exp: futureExp });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true for a token with exp in the past', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const token = makeJwt({ sub: 'u', exp: pastExp });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true when exp equals current time', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const token = makeJwt({ sub: 'u', exp: now / 1000 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true when no exp claim exists', () => {
    const token = makeJwt({ sub: 'u' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for an unparseable token', () => {
    expect(isTokenExpired('garbage')).toBe(true);
  });
});

describe('getTokenRemainingTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns positive ms remaining before expiry', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const token = makeJwt({ sub: 'u', exp: 1700000060 }); // 60s from now
    expect(getTokenRemainingTime(token)).toBe(60000);
  });

  it('returns 0 when token is already expired', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const token = makeJwt({ sub: 'u', exp: 1699999900 }); // 100s ago
    expect(getTokenRemainingTime(token)).toBe(0);
  });

  it('returns 0 when token has no exp claim', () => {
    const token = makeJwt({ sub: 'u' });
    expect(getTokenRemainingTime(token)).toBe(0);
  });

  it('returns 0 for an invalid token', () => {
    expect(getTokenRemainingTime('invalid')).toBe(0);
  });
});
