import { CloudFormationTemplate } from '../../CFNParser/stack/types';
import { CloudFormationParseContext } from '../../CFNParser/types';
import { parseValue } from '../../CFNParser/field-parser';

describe('cloudformation templates', () => {
  const nestedNoValue: CloudFormationTemplate = {
    Conditions: {
      AlwaysTrue: {
        'Fn::Equals': ['true', 'true'],
      },
      AlwaysFalse: {
        'Fn::Equals': ['false', 'true'],
      },
    },
    Resources: {
      DummyResource: {
        Type: 'Resource::Dummy',
        Properties: {
          ConditionalValue: {
            'Fn::If': ['AlwaysTrue', 'ConditionIsTrue', { Ref: 'AWS::NoValue' }],
          },
          ConditionalRef: {
            'Fn::If': ['AlwaysFalse', { Ref: 'AWS::NoValue' }, { Ref: 'SomeRef' }],
          },
          ConditionalNoValue: {
            'Fn::If': ['AlwaysTrue', { Ref: 'AWS::NoValue' }, { Ref: 'SomeRef' }],
          },
        },
      },
    },
  };
  const cfnContext: CloudFormationParseContext = {
    params: {},
    conditions: {
      AlwaysTrue: true,
      AlwaysFalse: false,
    },
    resources: {
      SomeRef: {
        Type: 'String',
        result: { ref: 'resolvedRefValue' },
      },
    },
    exports: {},
  };

  it('should resolve nested `Fn::If`', () => {
    const value = parseValue(nestedNoValue.Resources.DummyResource.Properties.ConditionalValue, cfnContext);
    expect(value).toEqual('ConditionIsTrue');
  });

  it('should resolve nested `Fn::If` and evaluate a resulting Ref', () => {
    const value = parseValue(nestedNoValue.Resources.DummyResource.Properties.ConditionalRef, cfnContext);
    expect(value).toEqual('resolvedRefValue');
  });

  it('should resolve nested `Fn::If` and evaluate a resulting `AWS::NoValue` Ref', () => {
    const value = parseValue(nestedNoValue.Resources.DummyResource.Properties.ConditionalNoValue, cfnContext);
    expect(value).toBeUndefined();
  });
});
