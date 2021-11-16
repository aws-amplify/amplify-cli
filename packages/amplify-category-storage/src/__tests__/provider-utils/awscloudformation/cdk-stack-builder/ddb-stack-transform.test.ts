/* These tests, test the tranform and in rurn the cdk builder too which is used within this file */

import { JSONUtilities, buildOverrideDir, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import { DDBStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import {
  DynamoDBCLIInputs,
  FieldType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import path from 'path';

jest.mock('amplify-cli-core', () => ({
  buildOverrideDir: jest.fn().mockResolvedValue(false),
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockbackendpath'),
    getResourceDirectoryPath: jest.fn().mockReturnValue('mockresourcepath'),
  },
}));
jest.mock('fs-extra', () => ({
  readFileSync: () => jest.fn().mockReturnValue('{ "Cognito": { "provider": "aws"}}'),
  existsSync: () => jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn().mockReturnValue(true),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('mockjoinedpath'),
  resolve: jest.fn().mockReturnValue('mockjoinedpath'),
}));

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');

describe('Test DDB transform generates correct CFN template', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Generated ddb template with all CLI configurations set with no overrides', async () => {
    const resourceName = 'mockResource';
    const cliInputsJSON: DynamoDBCLIInputs = {
      resourceName: resourceName,
      tableName: 'mocktablename',
      partitionKey: {
        fieldName: 'id',
        fieldType: FieldType.string,
      },
      sortKey: {
        fieldName: 'name',
        fieldType: FieldType.number,
      },
      gsi: [
        {
          name: 'gsiname',
          partitionKey: {
            fieldName: 'name',
            fieldType: FieldType.number,
          },
        },
        {
          name: 'updategsiname',
          partitionKey: {
            fieldName: 'col',
            fieldType: FieldType.string,
          },
        },
      ],
      triggerFunctions: [],
    };

    jest.spyOn(DynamoDBInputState.prototype, 'getCliInputPayload').mockImplementation(() => cliInputsJSON);
    const ddbTransform = new DDBStackTransform(resourceName);
    await ddbTransform.transform();

    console.log(ddbTransform._cfn);
    console.log(ddbTransform._cfnInputParams);

    expect(ddbTransform._cfn).toMatchSnapshot();
    expect(ddbTransform._cfnInputParams).toMatchSnapshot();
  });
});
