import * as fs from 'fs-extra';
import path from 'path';
import { validateImportAuthRequest } from '../../..';

const importAuthAssetsRoot = path.resolve(path.join(__dirname, '../../assets/auth/import'));

describe('validates import auth headless request', () => {
  test.each([
    ['identityPoolId is supplied', 'validRequest.json'],
    ['identityPoolId is not supplied', 'validRequest.identityPoolId.missing.json'],
  ])('with a resolved promise when a valid payload with %s', async (_, fileName: string) => {
    const rawRequest = fs.readFileSync(path.join(importAuthAssetsRoot, fileName), 'utf8');
    const result = await validateImportAuthRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('with a rejected promise when an invalid payload is supplied', async () => {
    const resultPromise = validateImportAuthRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  test.each([
    ['version', 'invalidRequest.version.missing.json'],
    ['userPoolId', 'invalidRequest.userPoolId.missing.json'],
    ['webClientId', 'invalidRequest.webClientId.missing.json'],
    ['nativeClientId', 'invalidRequest.nativeClientId.missing.json'],
  ])('with a rejected promise when the payload is missing %s', async (missingProperty: string, fileName: string) => {
    const rawRequest = fs.readFileSync(path.join(importAuthAssetsRoot, fileName), 'utf8');
    try {
      await validateImportAuthRequest(rawRequest);
    } catch (e) {
      if (missingProperty === 'version') {
        expect(e.message).toBe('data does not have a top level "version" field');
      } else {
        expect(e.message).toBe(
          `Data did not validate against the supplied schema. Underlying errors were [{"keyword":"required","dataPath":"","schemaPath":"#/required","params":{"missingProperty":"${missingProperty}"},"message":"should have required property '${missingProperty}'"}]`,
        );
      }
    }
  });
});
