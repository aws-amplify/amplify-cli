import * as crypto from 'crypto';
import { extractApplePrivateKey } from '../../../../provider-utils/awscloudformation/utils/extract-apple-private-key';

describe('When extracting apple private key...', () => {
  // The key is generated at runtime so that no static private-key-shaped literal is
  // committed to source (Mirador acat-bosco/rsa-private-key false-positive). P-256 is
  // the curve Sign in with Apple uses (ES256).
  const { privateKey: pem } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  const expectedOutput = crypto.createPrivateKey(pem).export({ type: 'pkcs8', format: 'der' }).toString('base64');

  it('it should remove new lines and space and comments', () => {
    const input = pem;
    expect(extractApplePrivateKey(input)).toEqual(expectedOutput);
  });

  it('it should not alter a pre extracted key', () => {
    const input = expectedOutput;
    expect(extractApplePrivateKey(input)).toEqual(expectedOutput);
  });
});
