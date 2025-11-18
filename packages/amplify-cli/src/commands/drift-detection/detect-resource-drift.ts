/**
 * Resource-level drift detection using AWS CloudControl API
 * Detects changes in resource properties that are NOT in CloudFormation templates
 */

import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';
import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';

export interface ResourceDrift {
  logicalResourceId: string;
  physicalResourceId: string;
  resourceType: string;
  propertyDifferences: Array<{
    propertyPath: string;
    expectedValue: any;
    actualValue: any;
    differenceType: 'NOT_IN_TEMPLATE' | 'MODIFIED';
  }>;
}

/**
 * Read-only properties that AWS automatically sets - these should be ignored
 */
const READ_ONLY_PROPERTIES = new Set([
  // IAM Role properties
  'Arn',
  'RoleId',
  'CreateDate',
  'Path', // Usually "/" by default
  'Description', // Empty by default
  'MaxSessionDuration', // 3600 by default

  // S3 Bucket properties
  'DomainName',
  'DualStackDomainName',
  'RegionalDomainName',
  'WebsiteURL',

  // Common properties
  'Tags', // Often auto-added by CloudFormation
  'CreationTime',
  'LastModifiedTime',
  'Owner',
  'OwnershipControls', // AWS sets default
]);

/**
 * Properties that are defaults and shouldn't be considered drift
 */
const DEFAULT_VALUES: Record<string, any> = {
  Path: '/',
  MaxSessionDuration: 3600,
  Description: '',
};

/**
 * Generic property comparison - finds properties in actual resource not in template
 */
function findPropertiesNotInTemplate(
  actualProperties: Record<string, any>,
  templateProperties: Record<string, any> | null,
  propertyMapping: Record<string, string> = {},
): Array<{ propertyPath: string; actualValue: any }> {
  const differences: Array<{ propertyPath: string; actualValue: any }> = [];
  const templateProps = templateProperties || {};

  for (const [actualKey, actualValue] of Object.entries(actualProperties)) {
    // Skip null/undefined values
    if (actualValue === null || actualValue === undefined) continue;

    // Skip read-only properties
    if (READ_ONLY_PROPERTIES.has(actualKey)) continue;

    // Skip properties that are at their default values
    if (actualKey in DEFAULT_VALUES && JSON.stringify(actualValue) === JSON.stringify(DEFAULT_VALUES[actualKey])) {
      continue;
    }

    // Map actual property name to template property name if mapping exists
    const templateKey = propertyMapping[actualKey] || actualKey;

    // Check if property exists in template
    if (!(templateKey in templateProps)) {
      // For objects/arrays, only include if they have meaningful content
      if (typeof actualValue === 'object') {
        if (Array.isArray(actualValue) && actualValue.length === 0) continue;
        if (!Array.isArray(actualValue) && Object.keys(actualValue).length === 0) continue;
      }

      differences.push({
        propertyPath: templateKey,
        actualValue,
      });
    }
  }

  return differences;
}

/**
 * Get template properties for a specific resource from CloudFormation template
 */
async function getTemplateProperties(cfn: CloudFormationClient, stackName: string, logicalResourceId: string): Promise<any> {
  try {
    const template = await cfn.send(new GetTemplateCommand({ StackName: stackName, TemplateStage: 'Original' }));
    if (!template.TemplateBody) return null;

    const parsed = JSON.parse(template.TemplateBody);
    return parsed.Resources?.[logicalResourceId]?.Properties || null;
  } catch {
    return null;
  }
}

/**
 * Detect drift using CloudControl API - gets ALL properties in one call
 */
async function detectResourceDrift(
  region: string,
  resourceType: string,
  resourceId: string,
  logicalResourceId: string,
  stackName?: string,
): Promise<ResourceDrift | null> {
  const cloudControl = new CloudControlClient({ region });
  const cfn = new CloudFormationClient({ region });

  try {
    // Get template properties
    let templateProperties = null;
    if (stackName) {
      templateProperties = await getTemplateProperties(cfn, stackName, logicalResourceId);
    }

    // Get complete resource state via CloudControl API
    const response = await cloudControl.send(
      new GetResourceCommand({
        TypeName: resourceType,
        Identifier: resourceId,
      }),
    );

    if (!response.ResourceDescription?.Properties) {
      return null;
    }

    // Parse the complete resource properties
    const actualProperties = JSON.parse(response.ResourceDescription.Properties);

    // Find properties not in template
    const notInTemplate = findPropertiesNotInTemplate(actualProperties, templateProperties);

    if (notInTemplate.length === 0) return null;

    // Convert to drift format
    const propertyDifferences = notInTemplate.map((diff) => ({
      propertyPath: diff.propertyPath,
      expectedValue: null,
      actualValue: diff.actualValue,
      differenceType: 'NOT_IN_TEMPLATE' as const,
    }));

    return {
      logicalResourceId,
      physicalResourceId: resourceId,
      resourceType,
      propertyDifferences,
    };
  } catch (error: any) {
    // CloudControl might not support this resource type
    // Log and skip silently
    if (error.name === 'UnsupportedResourceTypeException' || error.name === 'ResourceNotFoundException') {
      // Resource type not supported by CloudControl, skip silently
      return null;
    }
    console.error(`CloudControl API error for ${resourceType} ${resourceId}:`, error);
    return null;
  }
}

/**
 * Detect out-of-template drift for resources using CloudControl API
 */
export async function detectOutOfTemplateDrift(
  region: string,
  driftResults: StackResourceDrift[],
  stackName?: string,
): Promise<ResourceDrift[]> {
  const resourceDrifts: ResourceDrift[] = [];

  // Process each resource sequentially using CloudControl API
  for (const resource of driftResults) {
    if (!resource.PhysicalResourceId || !resource.LogicalResourceId || !resource.ResourceType) continue;

    const drift = await detectResourceDrift(
      region,
      resource.ResourceType,
      resource.PhysicalResourceId,
      resource.LogicalResourceId,
      stackName,
    );

    if (drift) {
      resourceDrifts.push(drift);
    }
  }

  return resourceDrifts;
}
