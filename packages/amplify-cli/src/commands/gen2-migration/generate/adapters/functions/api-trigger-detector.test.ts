import { ApiTriggerDetector } from './api-trigger-detector';
import { FunctionDefinition } from '../../core/migration-pipeline';
import { readCFNTemplate, CFNTemplateFormat } from '@aws-amplify/amplify-cli-core';

jest.mock('@aws-amplify/amplify-cli-core');
const mockReadCFNTemplate = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;

describe('ApiTriggerDetector', () => {
  it('should return empty array when no functions', () => {
    expect(ApiTriggerDetector.detectDynamoTriggers([])).toEqual([]);
  });

  it('should detect DynamoDB trigger', () => {
    const functions: FunctionDefinition[] = [{ resourceName: 'testFunc' }];

    mockReadCFNTemplate.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: {
        Resources: {
          LambdaEventSourceMappingPost: {
            Type: 'AWS::Lambda::EventSourceMapping',
            Properties: {
              EventSourceArn: {
                'Fn::ImportValue': {
                  'Fn::Sub': '${apidiscussionsfinalGraphQLAPIIdOutput}:GetAtt:PostTable:StreamArn',
                },
              },
            },
          },
        },
      },
    });

    const result = ApiTriggerDetector.detectDynamoTriggers(functions);
    expect(result).toEqual([{ functionName: 'testFunc', models: ['Post'] }]);
  });
});
