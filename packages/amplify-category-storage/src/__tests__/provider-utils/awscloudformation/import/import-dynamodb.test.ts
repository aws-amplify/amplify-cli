import { ensureHeadlessParameters } from '../../../../provider-utils/awscloudformation/import/import-dynamodb';
import { DynamoDBResourceParameters } from '../../../../provider-utils/awscloudformation/import/types';

test('throws amplify error when ddb headless params are missing during import storage', async () => {
  const resourceParams: DynamoDBResourceParameters = {
    resourceName: 'mockResourceName',
    serviceType: 'imported',
  };
  expect(() =>
    ensureHeadlessParameters(resourceParams, {
      region: 'mockRegion',
      tables: {
        table1: '',
        table2: '',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(`"storage headless expected 1 element for resource: mockResourceName, but found: 0"`);

  expect(() =>
    ensureHeadlessParameters(resourceParams, {
      region: '',
      tables: {
        table1: 'mockTable1',
        table2: 'mockTable2',
      },
    }),
  ).toThrowErrorMatchingInlineSnapshot(`"storage headless is missing the following inputParams region"`);
});
