import { decode, sign, verify } from 'jsonwebtoken';

export function generateToken(decodedToken: string | object): string {
  try {
    if (typeof decodedToken === 'string') {
      decodedToken = JSON.parse(decodedToken);
    }
    const token = sign(decodedToken, 'open-secrete');
    verify(token, 'open-secrete');
    return token;
  } catch (e) {
    const err = new Error('Error when generating OIDC token: ' + e.message);
    throw err;
  }
}

export function parse(token): object {
  const decodedToken = decode(token);
  return decodedToken;
}

/**
 * Updates the exp time of the static token to ensure the shipped token is fresh. If user passes an
 * issuer, updates the token with the issuer
 * @param token
 * @param issuer
 */
export function refreshToken(token: string, issuer?: string): string {
  const tokenObj: any = parse(token);
  if (!Object.keys(tokenObj).length) {
    throw new Error(`Invalid token ${token}`);
  }
  if (issuer) {
    tokenObj.iss = issuer;
  }
  tokenObj.exp = Math.floor(Date.now() / 100 + 20000);
  return generateToken(JSON.stringify(tokenObj));
}
