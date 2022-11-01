/* These tests test the DDBStackTransform and run the cdk builder tool which is used within this file */

import { $TSContext } from 'amplify-cli-core';
import { DDBStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import {
  DynamoDBCLIInputs,
  FieldType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/dynamoDB-user-input-types';
import { DynamoDBInputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  AmplifyCategories: {
    STORAGE: 'storage',
  },
  applyCategoryOverride: jest.fn(),
  CLIInputSchemaValidator: jest.fn().mockImplementation(function () { // cannot be arrow function to call with new
    return { validateInput: jest.fn().mockResolvedValue(true) };
  }),
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
    parse: JSON.parse,
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockBackendPath'),
    getResourceDirectoryPath: jest.fn().mockReturnValue('mockResourcePath'),
  },
  stateManager: {
    setResourceParametersJson: jest.fn(),
  },
}));

jest.mock('fs-extra', () => ({
  readFileSync: () => jest.fn().mockReturnValue('{ "Cognito": { "provider": "aws"}}'),
  existsSync: () => jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn().mockReturnValue(true),
}));

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('mockJoinedPath'),
  basename: jest.fn().mockReturnValue('mockBaseName'),
  dirname: jest.fn().mockReturnValue('mockDirName'),
  resolve: jest.fn().mockReturnValue('mockResolvedPath'),
}));

jest.mock('globby', () => ({})); // Not used by ddb transform, but gets pulled in from an unrelated amplify-cli-core method

// eslint-disable-next-line spellcheck/spell-checker
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');

describe('Test DDB transform generates correct CFN template', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    mockContext = {
      amplify: {
        getCategoryPluginInfo: (_context: $TSContext, category: string) => ({
          packageLocation: `@aws-amplify/amplify-category-${category}`,
        }),
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Generated DDB template with all CLI configurations set with no override', async () => {
    const resourceName = 'mockResource';
    const cliInputsJSON: DynamoDBCLIInputs = {
      resourceName,
      tableName: 'mockTableName',
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
          name: 'gsiName',
          partitionKey: {
            fieldName: 'name',
            fieldType: FieldType.number,
          },
        },
        {
          name: 'updateGsiName',
          partitionKey: {
            fieldName: 'col',
            fieldType: FieldType.string,
          },
        },
      ],
      triggerFunctions: [],
    };

    // const DynamoDBInputStateMock = DynamoDBInputState as jest.Mocked<typeof DynamoDBInputState>;
    jest.spyOn(DynamoDBInputState.prototype, 'getCliInputPayload').mockImplementation(() => cliInputsJSON);
    const ddbTransform = new DDBStackTransform(mockContext, resourceName);
    await ddbTransform.transform();

    expect(ddbTransform._cfn).toMatchSnapshot();
    expect(ddbTransform._cfnInputParams).toMatchSnapshot();
  });
});
