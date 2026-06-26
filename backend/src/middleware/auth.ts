import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Asymmetric (ES256/RS256) keys are fetched once from Supabase's JWKS endpoint
// and cached in-process by jose, so verification is offline after the first hit.
const JWKS = createRemoteJWKSet(new URL(`${env.supabaseUrl}/auth/v1/.well-known/jwks.json`), {
  cooldownDuration: 30_000,
  cacheMaxAge: 600_000,
});
// Legacy HS256 secret (used only if a token is symmetric).
const hsSecret = process.env.SUPABASE_JWT_SECRET ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET) : null;

/**
 * Verifies the Supabase access token locally (no network round-trip per request).
 * Supports both asymmetric (ES256/RS256 via JWKS) and legacy HS256 tokens.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    let payload: Record<string, unknown>;
    const alg = (() => {
      try { return decodeProtectedHeader(token).alg; } catch { return undefined; }
    })();

    try {
      if (alg && alg.startsWith('HS')) {
        if (!hsSecret) throw new Error('No HS secret configured');
        ({ payload } = await jwtVerify(token, hsSecret));
      } else {
        ({ payload } = await jwtVerify(token, JWKS));
      }
    } catch (e) {
      // Fall back to the other method once (covers projects mid-migration).
      try {
        if (alg && alg.startsWith('HS')) ({ payload } = await jwtVerify(token, JWKS));
        else if (hsSecret) ({ payload } = await jwtVerify(token, hsSecret));
        else throw e;
      } catch {
        throw new ApiError(401, 'Invalid or expired session');
      }
    }

    const id = payload.sub as string | undefined;
    if (!id) throw new ApiError(401, 'Invalid token');
    req.user = { id, email: (payload.email as string) ?? '' };
    next();
  } catch (err) {
    next(err);
  }
}
