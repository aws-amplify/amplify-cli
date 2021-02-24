import { $TSContext } from 'amplify-cli-core';
import { lambdaArnToConfig } from '../../api/lambda-arn-to-config';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import { loadLambdaConfig } from '../../utils/lambda/load-lambda-config';

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('test/path'),
  },
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
    const ex = () => lambdaArnToConfig(context_stub, { 'Fn::Sub': { key: 'cant interpret this' } });
    await expect(ex).toThrowError();
  });

  it('throws on unknown arn formats', async () => {
    const ex = () => lambdaArnToConfig(context_stub, ['dont know', 'what this is']);
    await expect(ex).toThrowError();
  });

  it('throws when arn is valid but no matching lambda found in the project', async () => {
    const ex = () => lambdaArnToConfig(context_stub, 'validformat::but::no::matchinglambda');
    await expect(ex).toThrowError();
  });
});
