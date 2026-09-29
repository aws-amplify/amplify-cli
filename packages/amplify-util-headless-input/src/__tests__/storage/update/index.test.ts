import * as fs from 'fs-extra';
import * as path from 'path';
import { validateUpdateStorageRequest } from '../../../index';

const topLevelMissingProperty: ExpectedFunction = (missingProperty: string) =>
  `Data did not validate against the supplied schema. Underlying errors were [{\"keyword\":\"required\",\"dataPath\":\"\",\"schemaPath\":\"#/required\",\"params\":{\"missingProperty\":\"${missingProperty}\"},\"message\":\"should have required property '${missingProperty}'\"}]`;
const serviceModificationMissingProperty: ExpectedFunction = (missingProperty: string) =>
  `Data did not validate against the supplied schema. Underlying errors were [{\"keyword\":\"required\",\"dataPath\":\".serviceModification\",\"schemaPath\":\"#/required\",\"params\":{\"missingProperty\":\"${missingProperty}\"},\"message\":\"should have required property '${missingProperty}'\"}]`;

type ExpectedFunction = (missingProperty: string) => string;

const updateStorageAssetsPath = path.resolve(path.join(__dirname, '..', '..', 'assets', 'storage', 'update'));

describe('validate update storage request', () => {
  it('returns valid payload', async () => {
    const rawRequest = fs.readFileSync(path.join(updateStorageAssetsPath, 'validUpdateStorageRequest.json'), 'utf8');
    const result = await validateUpdateStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });
});

describe('rejects promise when invalid payload', () => {
  it('rejects garbage', async () => {
    const resultPromise = validateUpdateStorageRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  test.each([
    [
      'version',
      'invalidRequest.missing.version.json',
      (missingProperty: string) => `data does not have a top level \"${missingProperty}\" field`,
    ],
    [
      'version',
      'invalidRequest.string.version.json',
      (missingProperty: string) => `data does not have a top level \"${missingProperty}\" field`,
    ],
    ['version', 'invalidRequest.invalid.version.json', (missingProperty: string) => `No schema found for ${missingProperty} 9999`],
    ['serviceModification', 'invalidRequest.missing.serviceModification.json', topLevelMissingProperty],
    ['serviceName', 'invalidRequest.missing.serviceName.json', serviceModificationMissingProperty],
    ['resourceName', 'invalidRequest.missing.resourceName.json', serviceModificationMissingProperty],
    ['permissions', 'invalidRequest.missing.permissions.json', serviceModificationMissingProperty],
  ])(
    'with a rejected promise when the payload is missing %s',
    async (missingProperty: string, fileName: string, expectedFn: ExpectedFunction) => {
      const rawRequest = fs.readFileSync(path.join(updateStorageAssetsPath, fileName), 'utf8');

      await expect(validateUpdateStorageRequest(rawRequest)).rejects.toThrow(expectedFn(missingProperty));
    },
  );
});
