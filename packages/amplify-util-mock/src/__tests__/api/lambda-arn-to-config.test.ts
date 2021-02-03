import { lambdaArnToConfig } from '../../api/lambda-arn-to-config';

describe('lambda arn to config', () => {
  // TODO need to create mocks for provisioned lambdas
  it('resolves string arns', () => {
    const result = lambdaArnToConfig('aws::arn::something::region::lambda1::otherstuff');
    expect(result).toEqual(provisionedLambdasStub[0]);
  });

  it('resolves Fn::Sub with params when lambda name is in template string', () => {
    const result = lambdaArnToConfig({ 'Fn::Sub': ['some::arn::lambda2::{withsubs}::stuff', { withsubs: 'a value' }] });
    expect(result).toEqual(provisionedLambdasStub[1]);
  });

  it('resolves Fn::Sub strings when lambda name is in template string', () => {
    const result = lambdaArnToConfig({ 'Fn::Sub': 'some::{sub}::string::with::lambda1::name' });
    expect(result).toEqual(provisionedLambdasStub[0]);
  });

  it('resolves Fn::GetAtt arns when lambda name is in resource name', () => {
    const result = lambdaArnToConfig({ 'Fn::GetAtt': ['functionlambda1resourcename', 'arn'] });
    expect(result).toEqual(provisionedLambdasStub[0]);
  });

  it('throws on malformed arn refs', () => {
    const ex = () => lambdaArnToConfig({ 'Fn::Sub': { key: 'cant interpret this' } });
    expect(ex).toThrowError();
  });

  it('throws on unknown arn formats', () => {
    const ex = () => lambdaArnToConfig(['dont know', 'what this is']);
    expect(ex).toThrowError();
  });

  it('throws when arn is valid but no matching lambda found in the project', () => {
    const ex = () => lambdaArnToConfig('validformat::but::no::matchinglambda');
    expect(ex).toThrowError();
  });
});
