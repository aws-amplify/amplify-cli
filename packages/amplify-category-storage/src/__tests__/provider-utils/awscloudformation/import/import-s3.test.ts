import { ensureHeadlessParameters } from '../../../../provider-utils/awscloudformation/import/import-s3';

test('throws amplify error when s3 headless params are missing during import storage', async () => {
  expect(() =>
    ensureHeadlessParameters({
      bucketName: '',
      region: '',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`"storage headless is missing the following inputParams bucketName, region"`);
});
