import {
  mergeParameters,
  processConditions,
  sortResources,
  filterResourcesBasedOnConditions,
  processResources,
  processOutputs,
  nestedStackHandler,
  processCloudFormationStack,
  CFN_PSEUDO_PARAMS,
  getDependencyResources,
} from '../../../CFNParser/stack';
import {
  CloudFormationResources,
  CloudFormationOutputs,
  CloudFormationTemplate,
  CloudFormationResource,
  CloudFormationTemplateFetcher,
} from '../../../CFNParser/stack/types';

import { getResourceProcessorFor } from '../../../CFNParser/resource-processors';

jest.mock('../../../CFNParser/resource-processors');

describe('CloudFormation stack', () => {
  describe('mergeParameters', () => {
    it('should use the value from inputParameter when passed', () => {
      expect(
        mergeParameters(
          {
            test: {
              Default: 'default test value',
              Type: 'String',
              Description: 'test description',
            },
          },
          {
            test: 'input from param',
          },
        ),
      ).toEqual({ ...CFN_PSEUDO_PARAMS, test: 'input from param' });
    });

    it('should return the default value when the inputParameter is missing the param', () => {
      expect(
        mergeParameters(
          {
            test: {
              Default: 'default test value',
              Type: 'String',
              Description: 'test description 1',
            },
          },
          {},
        ),
      ).toEqual({ ...CFN_PSEUDO_PARAMS, test: 'default test value' }); //?
    });
    it('should throw an error when the input is missing default value', () => {
      () =>
        mergeParameters(
          {
            test: {
              Type: 'String',
              Description: 'test description',
            },
          },
          {},
        ).toThrowError('missing default value');
    });
  });

  describe('processConditions', () => {
    it('should process the condition', () => {
      expect(
        processConditions(
          {
            CreateProdResources: { 'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'] },
            VerboseLogs: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'] }] },
          },
          { EnvType: 'prod' },
        ),
      ).toEqual({ CreateProdResources: true, VerboseLogs: false });
    });

    it('should use ref key when no value found', () => {
      expect(
        processConditions(
          {
            CreateProdResources: { 'Fn::Equals': [{ Ref: 'EnvType' }, 'EnvType'] },
          },
          {},
        ),
      ).toEqual({ CreateProdResources: true });
    });
  });

  describe('sortResources', () => {
    it('should sort resources on toplogical order', () => {
      const resources: CloudFormationResources = {
        resource1: {
          Properties: {},
          DependsOn: ['resource2', 'resource3'],
          Type: 'DummyResource',
        },
        resource3: {
          Properties: {},
          Type: 'DummyResource',
        },
        resource2: {
          Properties: {},
          DependsOn: ['resource3'],
          Type: 'DummyResource',
        },
      };
      expect(sortResources(resources, {})).toEqual(['resource3', 'resource2', 'resource1']);
    });

    it('should add Refed resource as dependency', () => {
      const resources: CloudFormationResources = {
        resource1: {
          Properties: {},
          DependsOn: ['resource2', 'resource3'],
          Type: 'DummyResource',
        },
        resource3: {
          Properties: {
            Prop1: { Ref: 'resource2' },
          },
          Type: 'DummyResource',
        },
        resource2: {
          Properties: {},
          Type: 'DummyResource',
        },
      };
      expect(sortResources(resources, {})).toEqual(['resource2', 'resource3', 'resource1']);
    });

    it("should add Fn::GetAtt'd resource as dependency", () => {
      const resources: CloudFormationResources = {
        resource1: {
          Properties: {},
          DependsOn: ['resource2', 'resource3'],
          Type: 'DummyResource',
        },
        resource3: {
          Properties: {
            Prop1: { 'Fn::GetAtt': ['resource2', 'prop1'] },
          },
          Type: 'DummyResource',
        },
        resource2: {
          Properties: {},
          Type: 'DummyResource',
        },
      };
      expect(sortResources(resources, {})).toEqual(['resource2', 'resource3', 'resource1']);
    });

    // it('should should throw error when intrinsic dependecy has missing resource', () => {
    //   const resources: CloudFormationResources = {

    //     resource3: {
    //       Properties: {
    //         Prop1: {'Ref': 'resource10'}
    //       },
    //       Type: 'DummyResource',
    //     },
    //   };
    //   expect(() => sortResources(resources, {})).toThrowError('Resource resource3 has missing intrinsic dependency resource resource10');
    // });

    it('should throw error when resource depends on non-existent resource', () => {
      const resources: CloudFormationResources = {
        resource1: {
          Properties: {},
          DependsOn: ['resource2', 'resource3'],
          Type: 'DummyResource',
        },
        resource2: {
          Properties: {},
          DependsOn: ['resource3'],
          Type: 'DummyResource',
        },
      };
      expect(() => sortResources(resources, {})).toThrowError('DependsOn a non-existent resource');
    });

    it('should throw error when resource Depends on itself', () => {
      const resources: CloudFormationResources = {
        resource1: {
          Properties: {},
          DependsOn: ['resource2', 'resource1'],
          Type: 'DummyResource',
        },
        resource2: {
          Properties: {},
          DependsOn: ['resource3'],
          Type: 'DummyResource',
        },
      };
      expect(() => sortResources(resources, {})).toThrowError('Resource resource1 can not depend on itself');
    });
  });
  describe('filterResourcesBasedOnConditions', () => {
    it("should remove resources that don't have condition set to true", () => {
      const filteredResources = filterResourcesBasedOnConditions(
        {
          resource1: {
            Properties: {},
            Condition: 'condition1',
            Type: 'resource1type',
          },
          resource2: {
            Properties: {},
            Condition: 'condition2',
            Type: 'resource1type',
          },
        },
        { condition1: true, condition2: false },
      );
      expect(Object.keys(filteredResources)).toContain('resource1');
      expect(Object.keys(filteredResources)).not.toContain('resource2');
    });

    it('should throw an error when condition is non-existent condition', () => {
      expect(() =>
        filterResourcesBasedOnConditions(
          {
            resource1: {
              Properties: {},
              Condition: 'non-existent-condition',
              Type: 'resource1type',
            },
          },
          {},
        ),
      ).toThrowError('not defined in Condition block');
    });
  });

  describe('processResources', () => {
    let getResourceProcessorForMock = getResourceProcessorFor as jest.Mock;
    let cfnResourceFetcher: CloudFormationTemplateFetcher = {
      getCloudFormationStackTemplate: jest.fn(),
    };
    const processedResource = { value: 'processed resource' };
    const processResourceMock = jest.fn();
    beforeEach(() => {
      jest.resetAllMocks();

      getResourceProcessorForMock.mockReturnValue(processResourceMock);
      processResourceMock.mockImplementation(() => ({ ...processedResource }));
    });

    it('should process individual resources', () => {
      const resources = {
        dummyResource: {
          Type: 'StackTest::DummyResource',
          Properties: {},
        },
      };
      expect(processResources({}, {}, resources, {}, cfnResourceFetcher)).toEqual({
        resources: {
          dummyResource: {
            result: processedResource,
            Type: 'StackTest::DummyResource',
          },
        },
        stackExports: {},
      });
      expect(getResourceProcessorForMock).toHaveBeenCalledTimes(1);
    });

    it('should not process resources when condition is not met', () => {
      const resources = {
        dummyResource2: {
          Type: 'StackTest::DummyResource',
          Properties: {},
          Condition: 'alwaysFalse',
        },
      };
      expect(processResources({}, { alwaysFalse: false }, resources, {}, cfnResourceFetcher)).toEqual({ resources: {}, stackExports: {} });
      expect(getResourceProcessorForMock).not.toHaveBeenCalled();
    });

    it('should topographically sort resources ', () => {
      const resources = {
        dummyResource1: {
          Type: 'StackTest::DummyResource',
          Properties: {},
          DependsOn: ['dummyResource2'],
        },
        dummyResource2: {
          Type: 'StackTest::DummyResourceType2',
          Properties: {},
        },
      };
      expect(processResources({}, {}, resources, {}, cfnResourceFetcher)).toEqual({
        resources: {
          dummyResource1: {
            result: processedResource,
            Type: 'StackTest::DummyResource',
          },
          dummyResource2: {
            result: processedResource,
            Type: 'StackTest::DummyResourceType2',
          },
        },
        stackExports: {},
      });
      expect(getResourceProcessorForMock).toHaveBeenCalledTimes(2);

      expect(getResourceProcessorForMock.mock.calls[0][0]).toEqual(resources.dummyResource2.Type);
      expect(processResourceMock.mock.calls[0][0]).toEqual('dummyResource2');
      expect(processResourceMock.mock.calls[0][1]).toEqual(resources['dummyResource2']);

      expect(getResourceProcessorForMock.mock.calls[1][0]).toEqual(resources.dummyResource1.Type);
      expect(processResourceMock.mock.calls[1][0]).toEqual('dummyResource1');
      expect(processResourceMock.mock.calls[1][1]).toEqual(resources['dummyResource1']);
    });

    it('should update the cfnContext to include previously processed resources', () => {
      const resources = {
        dummyResource1: {
          Type: 'StackTest::DummyResource',
          Properties: {},
        },
        dummyResource2: {
          Type: 'StackTest::DummyResourceType2',
          Properties: {},
        },
      };
      expect(processResources({}, {}, resources, {}, cfnResourceFetcher)).toEqual({
        resources: {
          dummyResource1: {
            result: processedResource,
            Type: 'StackTest::DummyResource',
          },
          dummyResource2: {
            result: processedResource,
            Type: 'StackTest::DummyResourceType2',
          },
        },
        stackExports: {},
      });

      const cfnContext = processResourceMock.mock.calls[1][2]; // signature of processResource(resourceName, resource, cfnContext, transformerContext)
      expect(cfnContext.resources).toEqual({
        dummyResource1: {
          result: processedResource,
          Type: resources.dummyResource1.Type,
        },
      });
    });

    it('should support processing nested stack and collect exported value from nested stacks', () => {
      const resources: CloudFormationResources = {
        nestedStack1: {
          Type: 'AWS::CloudFormation::Stack',
          Properties: {
            Parameters: {
              Foo: 'Foo Value',
            },
            TemplateURL: 'https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/nested1.stack.cloudformation.json',
          },
        },
        nestedStack2: {
          Type: 'AWS::CloudFormation::Stack',
          Properties: {
            Parameters: {
              Bar: 'Bar value',
            },
            TemplateURL: 'https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/nested2.stack.cloudformation.json',
          },
        },
      };

      const transformerOutput = {
        stacks: {
          'nested1.stack.cloudformation.json': {
            Parameters: {
              Foo: {
                Type: 'String',
                Default: 'Foo default value',
              },
              Bar: {
                Type: 'Number',
                Default: 10,
              },
            },
            Resources: {
              Nested1: {
                Type: 'Foo:DummyResource',
                Properties: {},
              },
            },
            Outputs: {
              nested1StackOutput: {
                Value: {
                  Ref: 'Bar',
                },
                Export: {
                  Name: 'BarValueFromNestedStack1',
                },
              },
            },
          },
          'nested2.stack.cloudformation.json': {
            Parameters: {
              Bar: {
                Type: 'String',
                Default: 'Foo default value',
              },
            },
            Resources: {
              Nested1: {
                Type: 'Foo:DummyResource',
                Properties: {},
              },
            },
            Outputs: {
              nested2StackOutput: {
                Value: {
                  Ref: 'Bar',
                },
                Export: {
                  Name: 'BarValueFromNestedStack2',
                },
              },
            },
          },
        },
      };
      cfnResourceFetcher.getCloudFormationStackTemplate = jest.fn().mockImplementation(templateName => {
        const template = templateName.replace('https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/', '');
        return transformerOutput.stacks[template] as CloudFormationTemplate;
      });

      const processedResources = processResources({}, {}, resources, {}, cfnResourceFetcher);
      expect(processedResources.stackExports).toEqual({
        BarValueFromNestedStack1: 10,
        BarValueFromNestedStack2: 'Bar value',
      });
    });
  });

  describe('processOutput', () => {
    const outputSection: CloudFormationOutputs = {
      GraphQLAPIIdOutput: {
        Description: 'Your GraphQL API ID with export.',
        Value: {
          'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
        },
        Export: {
          Name: {
            'Fn::Join': [
              ':',
              [
                {
                  Ref: 'AWS::StackName',
                },
                'GraphQLApiId',
              ],
            ],
          },
        },
      },
      GraphQLAPIIdOutputNoExport: {
        Description: 'Your GraphQL API ID with export.',
        Value: {
          'Fn::GetAtt': ['GraphQLAPI', 'ApiId'],
        },
      },
    };
    const parameters = {
      'AWS::StackName': 'myStack',
    };
    const resources = {
      GraphQLAPI: {
        result: {
          cfnExposedAttributes: { ApiId: 'ApiId' },
          ApiId: 'fakeApiId',
        },
      },
    };
    it('should generate exports when output has exports', () => {
      expect(processOutputs(outputSection, parameters, {}, resources, {})).toEqual({
        'myStack:GraphQLApiId': 'fakeApiId',
      });
    });
  });

  describe('nestedStackHandler', () => {
    const nestedTemplate: CloudFormationTemplate = {
      Parameters: {
        Foo: {
          Type: 'String',
          Default: 'Foo value',
        },
      },
      Resources: {
        fooResource: {
          Type: 'Dummy Resource',
          Properties: {},
        },
      },
      Outputs: {
        NestedStackExport: {
          Description: 'Export test',
          Value: {
            Ref: 'Foo',
          },
          Export: {
            Name: 'NestedStack:FooValue',
          },
        },
      },
    };

    let cfnResourceFetcher: CloudFormationTemplateFetcher;

    let getResourceProcessorForMock = getResourceProcessorFor as jest.Mock;
    const processedResource = { value: 'processed resource' };
    const processResourceMock = jest.fn();
    beforeEach(() => {
      jest.resetAllMocks();

      getResourceProcessorForMock.mockReturnValue(processResourceMock);
      processResourceMock.mockImplementation(() => ({ ...processedResource }));
      cfnResourceFetcher = {
        getCloudFormationStackTemplate: jest.fn(() => {
          return nestedTemplate;
        }),
      };
    });

    it('should support nested stack', () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          Parameters: {
            Foo: 'FOO OVERRIDE',
          },
          TemplateURL: 'https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/stack1',
        },
      };
      const processedStack = nestedStackHandler(
        'nestedStack',
        resource,
        { conditions: {}, exports: {}, params: {}, resources: {} },
        cfnResourceFetcher,
      );
      expect(processedStack.stackExports).toEqual({ 'NestedStack:FooValue': 'FOO OVERRIDE' });
      expect(cfnResourceFetcher.getCloudFormationStackTemplate).toHaveBeenCalledWith(resource.Properties.TemplateURL);
    });

    it('should throw error if the exported value already exists', () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          Parameters: {
            Foo: 'FOO OVERRIDE',
          },
          TemplateURL: 'https://s3.amazonaws.com/${S3DeploymentBucket}/${S3DeploymentRootKey}/stacks/stack1',
        },
      };
      expect(() =>
        nestedStackHandler(
          'nestedStack',
          resource,
          { conditions: {}, exports: { 'NestedStack:FooValue': 'Existing value' }, params: {}, resources: {} },
          cfnResourceFetcher,
        ),
      ).toThrowError('is already exported in a different stack');
    });

    it('should throw error if the nested stack resource does not have TemplateURL', () => {
      const resource: CloudFormationResource = {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {},
      };
      expect(() =>
        nestedStackHandler('nestedStack', resource, { conditions: {}, exports: {}, params: {}, resources: {} }, cfnResourceFetcher),
      ).toThrowError('Stack is missing required property TemplateURL');
    });
  });

  describe('processCloudFormationStack', () => {
    let getResourceProcessorForMock = getResourceProcessorFor as jest.Mock;
    const processedResource = { value: 'processed resource' };
    const processResourceMock = jest.fn();
    beforeEach(() => {
      jest.resetAllMocks();

      getResourceProcessorForMock.mockReturnValue(processResourceMock);
      processResourceMock.mockImplementation(() => ({ ...processedResource }));
    });

    it('should take a template and generate resources and exports', () => {
      const template: CloudFormationTemplate = {
        Parameters: {
          Foo: {
            Type: 'String',
            Default: 'Foo Default value',
          },
        },
        Conditions: {
          AlwaysFalse: {
            'Fn::Equals': ['false', 'true'],
          },
        },
        Resources: {
          DummyResource: {
            Type: 'Resource::Dummy',
            Properties: {},
          },
          ShouldNotExistInProcessedResource: {
            Type: 'Resource::Dummy',
            Properties: {},
            Condition: 'AlwaysFalse',
          },
        },
        Outputs: {
          Output1: {
            Value: { Ref: 'Foo' },
            Description: 'Some description',
            Export: {
              Name: 'ExportedValue',
            },
          },
        },
      };
      const processedTemplate = processCloudFormationStack(template, {}, {}, { getCloudFormationStackTemplate: jest.fn() });
      expect(processedTemplate.resources).toBeDefined();
      expect(processedTemplate.resources.DummyResource).toEqual({ result: processedResource, Type: 'Resource::Dummy' });
      expect(processedTemplate.resources.ShouldNotExistInProcessedResource).not.toBeDefined();
      expect(processedTemplate.stackExports).toBeDefined();
      expect(processedTemplate.stackExports.ExportedValue).toEqual('Foo Default value');
    });
  });

  describe('getDependencyResources', () => {
    it('should get Ref name as a dependency', () => {
      const propValue = {
        Ref: 'Foo',
      };
      expect(getDependencyResources(propValue, {})).toEqual(['Foo']);
    });

    it('should not include Ref if the Ref name is included in the Parameters', () => {
      const propValue = {
        Ref: 'Foo',
      };
      expect(getDependencyResources(propValue, { Foo: 'FooValue' })).toEqual([]);
    });
    it('should get Fn::GetAtt resource name as a dependency', () => {
      const propValue = {
        'Fn::GetAtt': ['FooBar', 'AttName'],
      };
      expect(getDependencyResources(propValue, {})).toEqual(['FooBar']);
    });
    it('should support getting dependency from nested props', () => {
      const propValue = {
        Functions: [
          {
            'Fn::GetAtt': ['Fn1', 'FunctionId'],
          },
          {
            'Fn::GetAtt': ['Fn2', 'FunctionId'],
          },
        ],
      };
      expect(getDependencyResources(propValue, {})).toEqual(['Fn1', 'Fn2']);
    });
  });
});
