import { Output, StackResourceSummary } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { CFNResource, CFNTemplate } from '../../_common/cfn-template';
import { walkCfnTree } from './cfn-tree-walker';
import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';

/**
 * Resolves output and resource references in a CloudFormation template by tree-walking.
 * Returns a new template; does not mutate input.
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
export async function resolveOutputs(params: {
  readonly template: CFNTemplate;
  readonly stackOutputs: Output[];
  readonly stackResources: StackResourceSummary[];
  readonly cloudControl: CloudControlClient;
}): Promise<CFNTemplate> {
  const { template, stackOutputs, stackResources, cloudControl } = params;
  const cloned = JSON.parse(JSON.stringify(template)) as CFNTemplate;
  // CDK omits Outputs when a stack has no cross-stack references (e.g. a standalone DDB table).
  const templateOutputs = cloned.Outputs ?? {};
  const templateResources = cloned.Resources;

  if (!templateResources) {
    throw new AmplifyError('CFNOutputError', {
      message: 'Template is missing Resources section',
    });
  }

  const refLookup = buildRefLookup(templateOutputs, stackOutputs);

  // Phase 1: Replace Refs and Fn::GetAttr
  cloned.Resources = (await walkCfnTree(templateResources, async (node) => {
    if ('Ref' in node && typeof node.Ref === 'string' && Object.keys(node).length === 1) {
      const value = refLookup.get(node.Ref);
      const physicalId = stackResources.find((r) => r.LogicalResourceId === node.Ref)?.PhysicalResourceId;
      const resolved = value ?? physicalId;
      if (resolved !== undefined) return resolved;
    }

    if ('Fn::GetAtt' in node && Array.isArray(node['Fn::GetAtt']) && Object.keys(node).length === 1) {
      const [logicalId, attrName] = node['Fn::GetAtt'] as [string, string];

      const stackResource = stackResources.find((r) => r.LogicalResourceId === logicalId);
      if (!stackResource) {
        throw new AmplifyError('CFNOutputError', { message: `Unable to find resource with id ${logicalId}` });
      }

      // Custom resource GetAtt attributes are returned by the backing Lambda
      // in its response Data object — they bear no relation to the physical
      // resource ID. Leave these unresolved so CloudFormation evaluates them.
      if (stackResource.ResourceType?.startsWith('Custom::') || stackResource.ResourceType === 'AWS::CloudFormation::CustomResource') {
        return undefined;
      }

      const physicalId = stackResource.PhysicalResourceId;

      const response = await cloudControl.send(new GetResourceCommand({ TypeName: stackResource.ResourceType, Identifier: physicalId }));
      const props = JSON.parse(response.ResourceDescription?.Properties ?? '{}');
      const value = props[attrName];
      if (value !== undefined) return value;
    }

    return undefined;
  })) as Record<string, CFNResource>;

  // Phase 2: Replace Output values with runtime stack output values
  for (const [outputKey, outputDef] of Object.entries(templateOutputs)) {
    const runtimeOutput = stackOutputs.find((o) => o.OutputKey === outputKey);
    if (!runtimeOutput?.OutputValue) {
      throw new AmplifyError('CFNOutputError', {
        message: `Stack output '${outputKey}' has no runtime value`,
      });
    }
    outputDef.Value = runtimeOutput.OutputValue;
  }

  return cloned;
}

/**
 * Builds a 'Ref' lookup table from stack outputs.
 * If an output value is defined as a { "Ref": "LogicalID" }, record { "LogicalId": "OutputValue" }
 */
function buildRefLookup(templateOutputs: Record<string, { Value: string | object }>, stackOutputs: Output[]): Map<string, string> {
  const refLookup = new Map<string, string>();

  for (const [outputKey, outputDef] of Object.entries(templateOutputs)) {
    const value = outputDef.Value;
    if (typeof value !== 'object' || value === null) continue;

    const runtimeOutput = stackOutputs.find((o) => o.OutputKey === outputKey);
    if (!runtimeOutput?.OutputValue) continue;

    const record = value as Record<string, unknown>;

    if ('Ref' in record && typeof record.Ref === 'string') {
      refLookup.set(record.Ref, runtimeOutput.OutputValue);
    }
  }

  return refLookup;
}
