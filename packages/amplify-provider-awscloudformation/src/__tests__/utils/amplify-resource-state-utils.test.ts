import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { getTableNames, getPreviousDeploymentRecord } from '../../utils/amplify-resource-state-utils';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const mockCfnClient = mockClient(CloudFormationClient);
mockCfnClient
  .on(DescribeStackResourcesCommand)
  .resolves({
    StackResources: [
      {
        LogicalResourceId: 'LogicalResourceIdTest1',
        PhysicalResourceId: 'PhysicalResourceIdTest',
        ResourceType: undefined,
        Timestamp: undefined,
        ResourceStatus: undefined,
      },
    ],
  })
  .on(DescribeStacksCommand)
  .resolves({
    Stacks: [
      {
        Outputs: [
          {
            OutputKey: 'GetAttLogicalResourceIdTest1TableName',
            OutputValue: 'TestStackOutputValue1',
          },
          {
            OutputKey: 'InvalidLogicalResourceIdTableName',
            OutputValue: 'TestStackOutputValue2',
          },
        ],
        Parameters: [
          {
            ParameterKey: 'TestParameterKey1',
            ParameterValue: 'TestParameterValue1',
          },
        ],
        Capabilities: ['CAPABILITY_IAM'],
        StackName: undefined,
        CreationTime: undefined,
        StackStatus: undefined,
      },
    ],
  });

describe('amplify-resource-state-utils', () => {
  const StackID = 'TestSTackID';

  test('test getTableNames', async () => {
    const tables = ['LogicalResourceIdTest1', 'LogicalResourceIdTest2'];
    const expectedTableNameMap: Map<string, string> = new Map();
    expectedTableNameMap.set('LogicalResourceIdTest1', 'TestStackOutputValue1');

    const tableNames = await getTableNames(mockCfnClient as unknown as CloudFormationClient, tables, StackID);
    expect(tableNames).toEqual(expectedTableNameMap);
  });

  test('test getPreviousDeploymentRecord', async () => {
    const expectedPrevDeploymentRecord = {
      capabilities: ['CAPABILITY_IAM'],
      parameters: { TestParameterKey1: 'TestParameterValue1' },
    };
    const prevDeploymentRecord = await getPreviousDeploymentRecord(mockCfnClient as unknown as CloudFormationClient, StackID);

    expect(prevDeploymentRecord).toEqual(expectedPrevDeploymentRecord);
  });
});
