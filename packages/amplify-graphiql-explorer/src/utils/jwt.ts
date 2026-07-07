import { decodeJwt, SignJWT, jwtVerify, JWTPayload } from 'jose';

export async function generateToken(decodedToken: string | object): Promise<string> {
  try {
    if (typeof decodedToken === 'string') {
      decodedToken = JSON.parse(decodedToken);
    }
    const secret = new TextEncoder().encode('open-secrete');
    const token = await new SignJWT(decodedToken as JWTPayload).setProtectedHeader({ alg: 'HS256' }).sign(secret);
    await jwtVerify(token, secret);
    return token;
  } catch (e) {
    const err = new Error('Error when generating OIDC token: ' + e.message);
    throw err;
  }
}

export function parse(token: string | undefined): object | null {
  if (typeof token === 'undefined' || typeof token !== 'string') {
    return null;
  }
  const decodedToken = decodeJwt(token);
  return decodedToken as object;
}

/**
 * Updates the exp time of the static token to ensure the shipped token is fresh. If user passes an
 * issuer, updates the token with the issuer
 * @param token
 * @param issuer
 */
export async function refreshToken(token: string, issuer?: string): Promise<string> {
  const tokenObj: any = parse(token);
  if (!Object.keys(tokenObj).length) {
    throw new Error(`Invalid token ${token}`);
  }
  if (issuer) {
    tokenObj.iss = issuer;
  }
  tokenObj.exp = Math.floor(Date.now() / 100 + 20000);
  return await generateToken(JSON.stringify(tokenObj));
}
