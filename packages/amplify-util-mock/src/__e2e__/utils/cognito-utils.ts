import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { v4 } from 'uuid';

export async function signUpAddToGroupAndGetJwtToken(
  userPool: string,
  username: string,
  email: string,
  groups: string[] = [],
  tokenType: 'id' | 'access' = 'id',
) {
  const token = {
    sub: v4(),
    // eslint-disable-next-line spellcheck/spell-checker
    aud: '75pk49boud2olipfda0ke3snic',
    'cognito:groups': groups,
    event_id: v4(),
    token_use: tokenType,
    auth_time: Math.floor(Date.now() / 1000),
    iss: `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_${userPool}`,
    'cognito:username': username,
    exp: Math.floor(Date.now() / 1000) + 10000,
    iat: Math.floor(Date.now() / 1000),
    email,
  };
  return await generateToken(token);
}

async function generateToken(decodedToken: string | object): Promise<string> {
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
