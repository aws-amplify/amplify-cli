import { ensureHeadlessParameters } from '../../../../provider-utils/awscloudformation/import/import-s3';

test('throws amplify error when auth headless params are missing during import auth', async () => {
  expect(() =>
    ensureHeadlessParameters({
      bucketName: '',
      region: '',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`"storage headless is missing the following inputParams bucketName, region"`);
});
