import * as fs from 'fs-extra';
import path from 'path';
import { validateImportStorageRequest } from '../../..';

const importStorageAssetsRoot = path.resolve(path.join(__dirname, '../../assets/storage/import'));

type ExpectedFunction = (missingProperty: string) => string;

describe('validates import storage headless request', () => {
  const topLevelMissingProperty: ExpectedFunction = (missingProperty: string) =>
    `Data did not validate against the supplied schema. Underlying errors were [{\"keyword\":\"required\",\"dataPath\":\"\",\"schemaPath\":\"#/required\",\"params\":{\"missingProperty\":\"${missingProperty}\"},\"message\":\"should have required property '${missingProperty}'\"}]`;
  const serviceConfigurationMissingProperty: ExpectedFunction = (missingProperty: string) =>
    `Data did not validate against the supplied schema. Underlying errors were [{\"keyword\":\"required\",\"dataPath\":\".serviceConfiguration\",\"schemaPath\":\"#/definitions/ImportS3ServiceConfiguration/required\",\"params\":{\"missingProperty\":\"${missingProperty}\"},\"message\":\"should have required property '${missingProperty}'\"}]`;

  it('valid payload passes validation', async () => {
    const rawRequest = fs.readFileSync(path.join(importStorageAssetsRoot, 'valid.importStorageRequest.json'), 'utf8');
    const result = await validateImportStorageRequest(rawRequest);
    expect(result).toMatchSnapshot();
  });

  it('non-json content rejects', async () => {
    const resultPromise = validateImportStorageRequest('garbage');
    await expect(resultPromise).rejects.toBeTruthy();
  });

  test.each([
    [
      'version',
      'invalidRequest.version.missing.json',
      (missingProperty: string) => `data does not have a top level \"${missingProperty}\" field`,
    ],
    [
      'version',
      'invalidRequest.version.string.json',
      (missingProperty: string) => `data does not have a top level \"${missingProperty}\" field`,
    ],
    ['version', 'invalidRequest.version.invalid.json', (missingProperty: string) => `No schema found for ${missingProperty} 9999`],
    ['serviceConfiguration', 'invalidRequest.missing.serviceConfiguration.json', topLevelMissingProperty],
    ['serviceName', 'invalidRequest.missing.serviceName.json', serviceConfigurationMissingProperty],
    ['bucketName', 'invalidRequest.missing.bucketName.json', serviceConfigurationMissingProperty],
  ])(
    'with a rejected promise when the payload is missing %s',
    async (missingProperty: string, fileName: string, expectedFn: ExpectedFunction) => {
      const rawRequest = fs.readFileSync(path.join(importStorageAssetsRoot, fileName), 'utf8');

      await expect(validateImportStorageRequest(rawRequest)).rejects.toThrow(expectedFn(missingProperty));
    },
  );
});
