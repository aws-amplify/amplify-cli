import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { lambdaArnToConfig } from '../../api/lambda-arn-to-config';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import { loadLambdaConfig } from '../../utils/lambda/load-lambda-config';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('test/path'),
  },
  ApiCategoryFacade: {
    getTransformerVersion: jest.fn().mockReturnValue(2),
  },
  getGraphQLTransformerFunctionDocLink: jest.fn().mockReturnValue('mockdocs'),
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      function: {
        lambda1: {
          service: 'Lambda',
        },
        lambda2: {
          service: 'Lambda',
        },
        lambdalayer: {
          service: 'LambdaLayer',
        },
      },
    }),
  },
}));

jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn(),
}));
const loadLambdaConfig_mock = loadLambdaConfig as jest.MockedFunction<typeof loadLambdaConfig>;

const expectedLambdaConfig = { name: 'mocklambda', handler: 'mock.handler', environment: {} } as ProcessedLambdaFunction;
loadLambdaConfig_mock.mockResolvedValue(expectedLambdaConfig);

const context_stub = {} as $TSContext;

describe('lambda arn to config', () => {
  beforeEach(() => jest.clearAllMocks());
  // TODO need to create mocks for provisioned lambdas
  it('resolves string arns', async () => {
    const result = await lambdaArnToConfig(context_stub, `aws::arn::something::region::lambda1::otherstuff`);
    expect(loadLambdaConfig_mock.mock.calls[0][1]).toEqual('lambda1');
    expect(result).toEqual(expectedLambdaConfig);
  });
  it('resolves Fn::Sub with params when lambda name is in template string', async () => {
    const result = await lambdaArnToConfig(context_stub, { 'Fn::Sub': [`some::arn::lambda2::{withsubs}::stuff`, { withsubs: 'a value' }] });
    expect(loadLambdaConfig_mock.mock.calls[0][1]).toEqual('lambda2');
    expect(result).toEqual(expectedLambdaConfig);
  });

  it('resolves Fn::Sub strings when lambda name is in template string', async () => {
    const result = await lambdaArnToConfig(context_stub, { 'Fn::Sub': `some::{sub}::string::with::lambda1::name` });
    expect(loadLambdaConfig_mock.mock.calls[0][1]).toEqual('lambda1');
    expect(result).toEqual(expectedLambdaConfig);
  });

  it('resolves Fn::GetAtt arns when lambda name is in resource name', async () => {
    const result = await lambdaArnToConfig(context_stub, { 'Fn::GetAtt': [`functionlambda1resourcename`, 'arn'] });
    expect(loadLambdaConfig_mock.mock.calls[0][1]).toEqual('lambda1');
    expect(result).toEqual(expectedLambdaConfig);
  });

  it('throws on malformed arn refs', async () => {
    await expect(lambdaArnToConfig(context_stub, { 'Fn::Sub': { key: 'cant interpret this' } })).rejects.toThrowError();
  });

  it('throws on unknown arn formats', async () => {
    await expect(lambdaArnToConfig(context_stub, ['dont know', 'what this is'])).rejects.toThrowError();
  });

  it('throws when arn is valid but no matching lambda found in the project', async () => {
    await expect(lambdaArnToConfig(context_stub, 'validformat::but::no::matchinglambda')).rejects.toThrowError(
      new AmplifyError('MockProcessError', {
        message: `Did not find a Lambda matching ARN [\"validformat::but::no::matchinglambda\"] in the project. Local mocking only supports Lambdas that are configured in the project.`,
        resolution: `Use 'amplify add function' in the root of your app directory to create a new Lambda Function. To connect an AWS Lambda resolver to the GraphQL API, add the @function directive to a field in your schema.`,
        link: expect.any(String),
      }),
    );
  });
});
