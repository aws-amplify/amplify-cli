import { open } from '@aws-amplify/amplify-cli-core';
import { console } from '../../../provider-utils/awscloudformation';

jest.mock('@aws-amplify/amplify-cli-core');

const openMock = open as jest.MockedFunction<typeof open>;

describe('awscloudformation function provider', () => {
  const provider = 'awscloudformation';
  beforeEach(() => jest.clearAllMocks());

  it('opens the DynamoDB console', async () => {
    const service = 'DynamoDB';
    const amplifyMetaMock = {
      storage: {
        TestTable: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
          output: {
            PartitionKeyName: 'id',
            Region: 'us-east-1',
            Name: 'TestTable-test',
          },
        },
      },
    };

    await console(amplifyMetaMock, provider, service);

    expect(openMock).toBeCalledWith(
      'https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=TestTable-test&tab=overview',
      { wait: false },
    );
  });

  it('opens the S3 console', async () => {
    const service = 'S3';
    const amplifyMetaMock = {
      storage: {
        TestTable: {
          service: 'S3',
          providerPlugin: 'awscloudformation',
          output: {
            Region: 'us-east-1',
            BucketName: 'TestBucket-test',
          },
        },
      },
    };

    await console(amplifyMetaMock, provider, service);

    expect(openMock).toBeCalledWith('https://s3.console.aws.amazon.com/s3/buckets/TestBucket-test?region=us-east-1', { wait: false });
  });
});
