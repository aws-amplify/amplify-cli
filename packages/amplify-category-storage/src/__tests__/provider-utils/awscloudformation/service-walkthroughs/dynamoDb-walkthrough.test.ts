import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { DynamoDBInputState } from '../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import { DDBStackTransform } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import { addWalkthrough, updateWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDb-walkthrough';
import {
  DynamoDBCLIInputs,
  FieldType,
} from '../../../../provider-utils/awscloudformation/service-walkthrough-types/dynamoDB-user-input-types';
import { getIAMPolicies } from '../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDb-walkthrough';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');
jest.mock('../../../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform');

describe('add ddb walkthrough tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    mockContext = {
      amplify: {
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
          };
        },
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('addWalkthrough() test', async () => {
    jest.spyOn(DynamoDBInputState.prototype, 'saveCliInputPayload').mockImplementation(async () => undefined);
    jest.spyOn(DDBStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    const expectedCLIInputsJSON: DynamoDBCLIInputs = {
      resourceName: 'mockresourcename',
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
          name: 'secondgsiname',
          partitionKey: {
            fieldName: 'id',
            fieldType: FieldType.string,
          },
          sortKey: {
            fieldName: 'name',
            fieldType: FieldType.number,
          },
        },
      ],
      triggerFunctions: [],
    };

    prompter.input = jest
      .fn()
      .mockReturnValueOnce('mockresourcename') // Provide a friendly name
      .mockResolvedValueOnce('mocktablename') // Provide table name
      .mockResolvedValueOnce('id') // What would you like to name this column
      .mockResolvedValueOnce('name') // What would you like to name this column
      .mockResolvedValueOnce('gsiname') // Provide the GSI name
      .mockResolvedValueOnce('secondgsiname'); // Provide the GSI name

    prompter.pick = jest
      .fn()
      .mockReturnValueOnce('string') // Choose the data type
      .mockReturnValueOnce('number') // Choose the data type
      .mockReturnValueOnce('id') // Choose partition key for the table
      .mockReturnValueOnce('name') // Choose sort key for the table
      .mockReturnValueOnce('name') // Choose partition key for the GSI
      .mockReturnValueOnce('id') // Choose partition key for the GSI
      .mockReturnValueOnce('name'); // Choose sort key for the GSI

    prompter.yesOrNo = jest
      .fn()
      .mockReturnValueOnce(true) // Would you like to add another column
      .mockReturnValueOnce(false) // Would you like to add another column
      .mockReturnValueOnce(true) // Do you want to add a sort key to your table?
      .mockReturnValueOnce(true) // Do you want to add global secondary indexes to your table?
      .mockReturnValueOnce(false) // Do you want to add a sort key to your global secondary index?
      .mockReturnValueOnce(true) // Do you want to add more global secondary indexes to your table?
      .mockReturnValueOnce(true) // Do you want to add a sort key to your global secondary index?
      .mockReturnValueOnce(false); // Do you want to add more global secondary indexes to your table?

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger for your Table?

    const returnedResourcename = await addWalkthrough(mockContext, 'dynamoDb-defaults');

    expect(returnedResourcename).toEqual('mockresourcename');
    expect(DynamoDBInputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

describe('update ddb walkthrough tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.mock('@aws-amplify/amplify-prompts');
    mockContext = {
      amplify: {
        getProjectDetails: () => {
          return {
            projectConfig: {
              projectName: 'mockProject',
            },
          };
        },
      },
      input: {
        options: {},
      },
    } as unknown as $TSContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updateWalkthrough() test to add gsi', async () => {
    const mockAmplifyMeta = {
      storage: {
        mockresourcename: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
        dynamoefb50875: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
      },
    };

    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const currentCLIInputsJSON: DynamoDBCLIInputs = {
      resourceName: 'mockresourcename',
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
      ],
      triggerFunctions: [],
    };

    jest.spyOn(DynamoDBInputState.prototype, 'getCliInputPayload').mockImplementation(() => currentCLIInputsJSON);

    jest.spyOn(DynamoDBInputState.prototype, 'saveCliInputPayload').mockImplementation(async () => undefined);
    jest.spyOn(DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(DDBStackTransform.prototype, 'transform').mockImplementation(() => Promise.resolve());

    prompter.input = jest
      .fn()
      .mockResolvedValueOnce('col') // What would you like to name this column
      .mockResolvedValueOnce('updategsiname'); // Provide the GSI name

    prompter.pick = jest
      .fn()
      .mockReturnValueOnce('mockresourcename') // Specify the resource that you would want to update
      .mockReturnValueOnce('string') // Choose the data type
      .mockReturnValueOnce('col') // Choose partition key for the GSI
      .mockReturnValueOnce('name'); // Choose sort key for the GSI

    prompter.yesOrNo = jest
      .fn()
      .mockReturnValueOnce(true) // Would you like to add another column
      .mockReturnValueOnce(false) // Would you like to add another column
      .mockReturnValueOnce(true) // Do you want to keep existing global secondary indexes created on your table?
      .mockReturnValueOnce(true) // Do you want to add global secondary indexes to your table?
      .mockReturnValueOnce(false) // Do you want to add a sort key to your global secondary index
      .mockReturnValueOnce(false); // Do you want to add more global secondary indexes to your table?

    prompter.confirmContinue = jest.fn().mockReturnValueOnce(false); // Do you want to add a Lambda Trigger for your Table?

    const returnedCLIInputs = await updateWalkthrough(mockContext);

    const expectedCLIInputsJSON: DynamoDBCLIInputs = {
      resourceName: 'mockresourcename',
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

    expect(returnedCLIInputs).toEqual(expectedCLIInputsJSON);
    expect(DynamoDBInputState.prototype.saveCliInputPayload).toHaveBeenCalledWith(expectedCLIInputsJSON);
  });
});

describe('PartiQL Policies', () => {
  it('create', async () => {
    const { policy } = getIAMPolicies('Dummy', ['create']);
    const actions = policy.Action as string[];
    expect(actions.includes('dynamodb:PartiQLInsert')).toBe(true);
  });

  it('update', async () => {
    const { policy } = getIAMPolicies('Dummy', ['update']);
    const actions = policy.Action as string[];
    expect(actions.includes('dynamodb:PartiQLUpdate')).toBe(true);
  });

  it('read', async () => {
    const { policy } = getIAMPolicies('Dummy', ['read']);
    const actions = policy.Action as string[];
    expect(actions.includes('dynamodb:PartiQLSelect')).toBe(true);
  });

  it('delete', async () => {
    const { policy } = getIAMPolicies('Dummy', ['delete']);
    const actions = policy.Action as string[];
    expect(actions.includes('dynamodb:PartiQLDelete')).toBe(true);
  });
});
