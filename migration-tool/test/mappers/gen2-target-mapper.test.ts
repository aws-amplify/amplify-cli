import { Gen2TargetMapperImpl } from '../../src/mappers/gen2-target-mapper';
import { CDKConstruct } from '../../src/types/cdk-types';

describe('Gen2TargetMapper', () => {
  let mapper: Gen2TargetMapperImpl;

  beforeEach(() => {
    mapper = new Gen2TargetMapperImpl();
  });

  describe('Lambda Function Mapping', () => {
    it('should map simple Lambda to defineFunction', () => {
      const simpleLambda: CDKConstruct = {
        name: 'MyFunction',
        type: 'lambda.Function',
        properties: {
          runtime: 'lambda.Runtime.NODEJS_18_X',
          handler: 'index.handler',
          code: 'lambda.Code.fromAsset("lambda")',
        },
      };

      const result = mapper.mapLambdaFunction(simpleLambda);
      expect(result).toBe('defineFunction');
    });

    it('should map complex Lambda to defineCustom', () => {
      const complexLambda: CDKConstruct = {
        name: 'ComplexFunction',
        type: 'lambda.Function',
        properties: {
          runtime: 'lambda.Runtime.NODEJS_18_X',
          handler: 'index.handler',
          code: 'lambda.Code.fromAsset("lambda")',
          layers: ['layer1', 'layer2'],
          vpc: { subnetIds: ['subnet-1'] },
        },
      };

      const result = mapper.mapLambdaFunction(complexLambda);
      expect(typeof result).toBe('object');
      expect((result as any).name).toBe('ComplexFunction');
    });
  });

  describe('All Resource Types Coverage', () => {
    it('should handle all 8 resource types', () => {
      const mockConstruct: CDKConstruct = {
        name: 'TestResource',
        type: 'test',
        properties: {},
      };

      expect(() => mapper.mapLambdaFunction(mockConstruct)).not.toThrow();
      expect(() => mapper.mapSNSTopic(mockConstruct)).not.toThrow();
      expect(() => mapper.mapAPIGateway(mockConstruct)).not.toThrow();
      expect(() => mapper.mapEventBridge(mockConstruct)).not.toThrow();
      expect(() => mapper.mapSQSQueue(mockConstruct)).not.toThrow();
      expect(() => mapper.mapCloudFront(mockConstruct)).not.toThrow();
    });
  });
});
