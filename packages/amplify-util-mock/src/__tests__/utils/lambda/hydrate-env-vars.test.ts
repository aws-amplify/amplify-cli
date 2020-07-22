import { hydrateAllEnvVars, Resources, ApiDetails } from '../../../utils/lambda/hydrate-env-vars';

describe('hydrateAllEnvVars', () => {
  it('should return values from resource output', () => {
    expect(hydrateAllEnvVars([], { test: 'test-val' })).toEqual({ test: 'test-val' });
  });
  it('should return values from resource outputs', () => {
    const resources: Resources = [
      {
        resourceName: 'resource-1',
        category: 'category1',
        output: {
          output1: 'expected output 1',
        },
      },
    ];
    const sourceEnvVar = {
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'source value',
    };
    expect(hydrateAllEnvVars(resources, sourceEnvVar)).toEqual({
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'expected output 1',
    });
  });
  it('should include api mocked API details in output env vars', () => {
    const resources: Resources = [
      {
        resourceName: 'resource-1',
        category: 'category1',
        output: {
          output1: 'expected output 1',
        },
      },
    ];
    const sourceEnvVar = {
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'source value',
      API_FOO_GRAPHQLAPIENDPOINTOUTPUT: 'http://appsync.com',
      API_FOO_GRAPHQLAPIKEYOUTPUT: 'My-Api-Key-from-cfn',
      API_FOO_GRAPHQLAPIIDOUTPUT: 'my-api-from-cfn',
    };

    const apiDetails: ApiDetails = {
      apiId: 'my-api-id-from-mock',
      apiKey: 'my-api-key-from-mock',
      apiName: 'foo',
      url: 'http://url-from-mock',
      dataSources: [
        {
          Arn: 'arn-from-api',
          name: 'TodoTable',
          type: 'AMAZON_DYNAMODB',
        },
        {
          name: 'TodoTable',
          type: 'LAMBDA',
          Arn: 'lambda-arn',
        },
      ],
    };
    expect(hydrateAllEnvVars(resources, sourceEnvVar, apiDetails)).toEqual({
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'expected output 1',
      API_FOO_GRAPHQLAPIENDPOINTOUTPUT: apiDetails.url,
      API_FOO_GRAPHQLAPIKEYOUTPUT: apiDetails.apiKey,
      API_FOO_GRAPHQLAPIIDOUTPUT: apiDetails.apiId,
    });
  });

  it('should geneate DynamoDB table name and arn', () => {
    const resources: Resources = [
      {
        resourceName: 'resource-1',
        category: 'category1',
        output: {
          output1: 'expected output 1',
        },
      },
    ];
    const sourceEnvVar = {
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'source value',
      API_FOO_TODOTABLE_ARN: 'un-known',
      API_FOO_TODOTABLE_NAME: 'un-known',
    };

    const apiDetails: ApiDetails = {
      apiId: 'my-api-id-from-mock',
      apiKey: 'my-api-key-from-mock',
      apiName: 'foo',
      url: 'http://url-from-mock',
      dataSources: [
        {
          Arn: 'arn-from-api',
          name: 'TodoTable',
          type: 'AMAZON_DYNAMODB',
        },
      ],
    };
    expect(hydrateAllEnvVars(resources, sourceEnvVar, apiDetails)).toEqual({
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'expected output 1',
      API_FOO_TODOTABLE_NAME: apiDetails.dataSources[0].name,
      API_FOO_TODOTABLE_ARN: apiDetails.dataSources[0].Arn,
    });
  });
  it('should not generate Arn and Table name for non Lambda data sources', () => {
    const resources: Resources = [
      {
        resourceName: 'resource-1',
        category: 'category1',
        output: {
          output1: 'expected output 1',
        },
      },
    ];
    const sourceEnvVar = {
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'source value',
      API_FOO_TODOTABLE_ARN: 'un-known-Arn',
      API_FOO_TODOTABLE_NAME: 'un-known-table-name',
    };

    const apiDetails: ApiDetails = {
      apiId: 'my-api-id-from-mock',
      apiKey: 'my-api-key-from-mock',
      apiName: 'foo',
      url: 'http://url-from-mock',
      dataSources: [
        {
          Arn: 'arn-from-api',
          name: 'TodoTable',
          type: 'Lambda',
        },
      ],
    };
    expect(hydrateAllEnvVars(resources, sourceEnvVar, apiDetails)).toEqual({
      'CATEGORY1_RESOURCE-1_OUTPUT1': 'expected output 1',
      API_FOO_TODOTABLE_ARN: 'un-known-Arn',
      API_FOO_TODOTABLE_NAME: 'un-known-table-name',
    });
  });
});
