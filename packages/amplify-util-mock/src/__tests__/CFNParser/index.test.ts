import { processParams, processConditions, walkCfnConditions } from '../../CFNParser/index';

describe('CFNParser', () => {
  describe('processParams', () => {
    it('should process parameters', () => {
      const params = { foo: 'Foo params value' };
      const cfnParamBlock = {
        foo: {
          Default: 'foo default value',
          Type: 'String'
        },
        bar: {
          Default: 'bar default value',
          Type: 'String'
        }
      };
      const processedParam = processParams(params, cfnParamBlock, 'foo-stack');
      expect(processedParam['foo']).toEqual('Foo params value');
      expect(processedParam['bar']).toEqual('bar default value');
    });

    it('should throw error if a param is not in param and does not have default value', () => {
      const params = { foo: 'Foo params value' };
      const cfnParamBlock = {
        foo: {
          Default: 'foo default value',
          Type: 'String'
        },
        bar: {
          Type: 'String'
        }
      };
      expect(() => processParams(params, cfnParamBlock, 'foo-stack')).toThrowError();
    });
    it('should throw error if there is extra params in param and not in cfn block', () => {
      const params = { bar: 'bar params value' };
      const cfnParamBlock = {
        foo: {
          Default: 'foo default value',
          Type: 'String'
        }
      };
      expect(() => processParams(params, cfnParamBlock, 'foo-stack')).toThrowError();
    });
  });
  describe('process conditions', () => {
    it('should parse conditions', () => {
      const params = {
        val1: true,
        val2: 'foo',
        val3: 24
      };
      const inputConditions = {
        condition3:{ 'Fn::Not': [{ Condition: 'condition2' }] },
        condition1: { 'Fn::Equals': ['foo', { Ref: 'val2' }] },
        condition2: { 'Fn::Not': [{ Ref: 'val1' }] },
      };
      const processedConditions = processConditions(params, inputConditions, {});
      expect(processedConditions).toEqual({
        condition1: true,
        condition2: false,
        condition3: true
      });
    })

  });
});
