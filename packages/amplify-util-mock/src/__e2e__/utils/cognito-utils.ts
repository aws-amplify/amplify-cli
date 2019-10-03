import { sign, verify } from 'jsonwebtoken';
import { v4 } from 'uuid';

export function signUpAddToGroupAndGetJwtToken(
  userPool: string,
  username: string,
  email: string,
  groups: string[] = [],
  tokenType: 'id' | 'access' = 'id'
) {
  const token = {
    sub: v4(),
    aud: '75pk49boud2olipfda0ke3snic',
    'cognito:groups': groups,
    event_id: v4(),
    token_use: tokenType,
    auth_time: Math.floor(Date.now() / 1000),
    iss: `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_${userPool}`,
    'cognito:username': username,
    exp: Math.floor(Date.now() / 1000) + 10000,
    iat: Math.floor(Date.now() / 1000),
    email: 'user1@test.com',
  };
  return generateToken(token);
}

function generateToken(decodedToken: string | object): string {
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
