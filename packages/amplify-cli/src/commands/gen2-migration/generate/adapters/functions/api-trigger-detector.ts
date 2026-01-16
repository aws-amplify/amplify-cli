import { readCFNTemplate } from '@aws-amplify/amplify-cli-core';
import path from 'path';
import { FunctionDefinition } from '../../core/migration-pipeline';

export interface DynamoTriggerInfo {
  functionName: string;
  models: string[];
}

export class ApiTriggerDetector {
  /**
   * Identifies functions that have DynamoDB triggers and the models they're triggered on
   */
  static detectDynamoTriggers(functions: FunctionDefinition[]): DynamoTriggerInfo[] {
    const triggers: DynamoTriggerInfo[] = [];

    for (const func of functions) {
      if (func.resourceName) {
        const models = this.extractTriggeredModels(func.resourceName);
        if (models.length > 0) {
          triggers.push({ functionName: func.resourceName, models });
        }
      }
    }

    return triggers;
  }

  /**
   * Extracts model names that trigger a specific function from CloudFormation template
   *
   * Logic:
   * 1. Read function's CloudFormation template from amplify/backend/function/{name}/{name}-cloudformation-template.json
   * 2. Find AWS::Lambda::EventSourceMapping resources (these define DynamoDB triggers)
   * 3. Extract EventSourceArn which references DynamoDB table streams via Fn::ImportValue
   * 4. Parse the import value pattern "${env}:GetAtt:ModelNameTable:StreamArn" to extract model names
   */
  private static extractTriggeredModels(functionName: string): string[] {
    const templatePath = path.join('amplify', 'backend', 'function', functionName, `${functionName}-cloudformation-template.json`);
    const { cfnTemplate } = readCFNTemplate(templatePath);
    const models: string[] = [];

    // Look for DynamoDB event source mappings in the template
    for (const [, resource] of Object.entries(cfnTemplate.Resources || {})) {
      if (resource.Type === 'AWS::Lambda::EventSourceMapping' && resource.Properties?.EventSourceArn) {
        const eventSourceArn = resource.Properties.EventSourceArn;

        // Check if it's a DynamoDB stream ARN reference
        if (eventSourceArn['Fn::ImportValue']?.['Fn::Sub']) {
          const importValue = eventSourceArn['Fn::ImportValue']['Fn::Sub'];
          // Extract model name from pattern like "${apiId}:GetAtt:PostTable:StreamArn"
          const match = importValue.match(/:GetAtt:(\w+)Table:StreamArn/);
          if (match) {
            models.push(match[1]);
          }
        }
      }
    }

    return models;
  }
}
