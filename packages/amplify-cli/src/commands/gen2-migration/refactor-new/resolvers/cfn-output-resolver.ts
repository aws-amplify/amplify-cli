import { Output, StackResource } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNTemplate } from '../cfn-template';
import { walkCfnTree } from './cfn-tree-walker';

/**
 * Resolves output and resource references in a CloudFormation template by tree-walking.
 *
 * Two-phase resolution:
 * 1. Walk template.Resources — resolve {"Ref": "X"} and {"Fn::GetAtt": ["X", "Attr"]} using
 *    stack outputs and ARN construction.
 * 2. Walk template.Resources again — resolve remaining {"Fn::GetAtt": ["X", "Attr"]} using
 *    physical resource IDs from DescribeStackResources (fallback path).
 * 3. Replace each template.Outputs[key].Value with the runtime OutputValue from DescribeStacks.
 *
 * Operates on Resources only (not the whole template). Outputs are replaced separately.
 */
export function resolveOutputs(
  template: CFNTemplate,
  stackOutputs: Output[],
  stackResources: StackResource[],
  region: string,
  accountId: string,
): CFNTemplate {
  const cloned = JSON.parse(JSON.stringify(template)) as CFNTemplate;
  const templateOutputs = cloned.Outputs;
  const templateResources = cloned.Resources;

  if (!templateOutputs || !templateResources) {
    throw new AmplifyError('InvalidStackError', {
      message: 'Template is missing Outputs or Resources section',
    });
  }

  // Build separate lookups for Ref-based and GetAtt-based outputs.
  // A single resource can appear in both (e.g., UserPool has Ref → pool ID, GetAtt → ARN).
  // Conflating them into one map would overwrite the Ref value with the GetAtt value.
  const { refLookup, getAttLookup } = buildOutputLookup(templateOutputs, stackOutputs);

  // Phase 1: Resolve Ref/GetAtt in Resources using stack outputs
  cloned.Resources = walkCfnTree(templateResources, (node) => {
    // {"Ref": "LogicalId"} → replace with stack output value from Ref-based outputs
    if ('Ref' in node && typeof node.Ref === 'string' && Object.keys(node).length === 1) {
      const value = refLookup.get(node.Ref);
      if (value !== undefined) return value;
    }

    // {"Fn::GetAtt": ["LogicalId", "AttrName"]} → resolve via GetAtt-based outputs + ARN builder
    if ('Fn::GetAtt' in node && Array.isArray(node['Fn::GetAtt']) && Object.keys(node).length === 1) {
      const [logicalId, attrName] = node['Fn::GetAtt'] as [string, string];
      if (typeof logicalId === 'string' && typeof attrName === 'string') {
        const outputValue = getAttLookup.get(logicalId);
        if (outputValue !== undefined && attrName === 'Arn') {
          const resourceType = templateResources[logicalId]?.Type;
          if (resourceType) {
            const arn = buildArn(resourceType, outputValue, region, accountId);
            if (arn) return arn;
          }
        }
      }
    }

    return undefined;
  }) as Record<string, import('../cfn-template').CFNResource>;

  // Phase 2: Resolve remaining Fn::GetAtt using physical resource IDs (fallback)
  cloned.Resources = walkCfnTree(cloned.Resources, (node) => {
    if ('Fn::GetAtt' in node && Array.isArray(node['Fn::GetAtt']) && Object.keys(node).length === 1) {
      const [logicalId, attrName] = node['Fn::GetAtt'] as [string, string];
      if (typeof logicalId !== 'string' || typeof attrName !== 'string') return undefined;

      const stackResource = stackResources.find((r) => r.LogicalResourceId === logicalId);
      if (!stackResource?.PhysicalResourceId) return undefined;

      const physicalId = stackResource.PhysicalResourceId;
      const resourceType = stackResource.ResourceType ?? '';

      // Kinesis streams require ARN in outputs — physical ID is the stream name, not ARN
      if (resourceType === 'AWS::Kinesis::Stream' && attrName === 'Arn' && !physicalId.startsWith('arn:aws:kinesis')) {
        throw new AmplifyError('InvalidStackError', {
          message:
            `Kinesis stream ARN must be exposed in CloudFormation outputs. ` +
            `Found physical resource ID '${physicalId}' for logical resource '${logicalId}' which is not a valid ARN. ` +
            `Please add an output with Fn::GetAtt for the Kinesis stream's Arn attribute.`,
        });
      }

      if (attrName === 'Arn') {
        // SQS physical IDs are HTTP URLs — extract queue name for ARN construction
        const resourceId = physicalId.startsWith('http') ? physicalId.split('/').pop()! : physicalId;
        const arn = buildArn(resourceType, resourceId, region, accountId);
        return arn ?? physicalId;
      }

      return physicalId;
    }

    return undefined;
  }) as Record<string, import('../cfn-template').CFNResource>;

  // Phase 3: Replace Output values with runtime stack output values
  for (const [outputKey, outputDef] of Object.entries(cloned.Outputs)) {
    const runtimeOutput = stackOutputs.find((o) => o.OutputKey === outputKey);
    if (!runtimeOutput?.OutputValue) {
      throw new AmplifyError('InvalidStackError', {
        message: `Stack output '${outputKey}' has no runtime value`,
      });
    }
    outputDef.Value = runtimeOutput.OutputValue;
  }

  return cloned;
}

/**
 * Builds separate lookups for Ref-based and GetAtt-based outputs.
 * A single resource can have both (e.g., UserPool: Ref → pool ID, GetAtt → ARN).
 */
function buildOutputLookup(
  templateOutputs: Record<string, { Value: string | object }>,
  stackOutputs: Output[],
): { refLookup: Map<string, string>; getAttLookup: Map<string, string> } {
  const refLookup = new Map<string, string>();
  const getAttLookup = new Map<string, string>();

  for (const [outputKey, outputDef] of Object.entries(templateOutputs)) {
    const value = outputDef.Value;
    if (typeof value !== 'object' || value === null) continue;

    const runtimeOutput = stackOutputs.find((o) => o.OutputKey === outputKey);
    if (!runtimeOutput?.OutputValue) continue;

    const record = value as Record<string, unknown>;

    if ('Ref' in record && typeof record.Ref === 'string') {
      refLookup.set(record.Ref, runtimeOutput.OutputValue);
    } else if ('Fn::GetAtt' in record && Array.isArray(record['Fn::GetAtt'])) {
      getAttLookup.set(record['Fn::GetAtt'][0] as string, runtimeOutput.OutputValue);
    }
  }

  return { refLookup, getAttLookup };
}

/**
 * Constructs an ARN for a given resource type and identifier.
 * Returns undefined if the resource type is not supported.
 */
function buildArn(resourceType: string, resourceId: string, region: string, accountId: string): string | undefined {
  switch (resourceType) {
    case 'AWS::S3::Bucket':
      return `arn:aws:s3:::${resourceId}`;
    case 'AWS::DynamoDB::Table':
      return `arn:aws:dynamodb:${region}:${accountId}:table/${resourceId}`;
    case 'AWS::Cognito::UserPool':
      return `arn:aws:cognito-idp:${region}:${accountId}:userpool/${resourceId}`;
    case 'AWS::IAM::Role':
      return resourceId.startsWith('arn:aws:iam') ? resourceId : `arn:aws:iam::${accountId}:role/${resourceId}`;
    case 'AWS::SQS::Queue':
      return `arn:aws:sqs:${region}:${accountId}:${resourceId}`;
    case 'AWS::Lambda::Function':
      return `arn:aws:lambda:${region}:${accountId}:function:${resourceId}`;
    case 'AWS::Kinesis::Stream':
      return resourceId; // Already an ARN
    default:
      return undefined;
  }
}
