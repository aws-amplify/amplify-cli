import { AWS_RESOURCE_ATTRIBUTES, CFN_RESOURCE_TYPES, CFNTemplate } from '../types';
import assert from 'node:assert';
import { Output, StackResource } from '@aws-sdk/client-cloudformation';

const REF = 'Ref';
const GET_ATT = 'Fn::GetAtt';

/**
 * This class is responsible for resolving logical resource ids in a CloudFormation template
 * with their corresponding stack outputs.
 */
class CfnOutputResolver {
  constructor(private readonly template: CFNTemplate, private readonly region: string, private readonly accountId: string) {}

  public resolve(logicalResourceIds: string[], stackOutputs: Output[], stackResources: StackResource[]): CFNTemplate {
    const resources = this.template?.Resources;
    assert(resources);
    const clonedStackTemplate = JSON.parse(JSON.stringify(this.template)) as CFNTemplate;
    const stackTemplateOutputs = this.template?.Outputs;
    const stackTemplateResources = this.template?.Resources;
    assert(stackTemplateResources);
    assert(stackOutputs);
    assert(stackTemplateOutputs);
    let stackTemplateResourcesString = JSON.stringify(stackTemplateResources);

    Object.entries(stackTemplateOutputs).forEach(([outputKey, outputValue]) => {
      const value = outputValue.Value;
      const stackOutputValue = stackOutputs?.find((op) => op.OutputKey === outputKey)?.OutputValue;
      assert(stackOutputValue);

      if (typeof value !== 'object') {
        return;
      }

      let logicalResourceId: string | undefined;
      // Replace logicalId references using stack output values
      if (REF in value && typeof value[REF] === 'string') {
        logicalResourceId = value[REF];
        const outputRegexp = new RegExp(`{"${REF}":"${logicalResourceId}"}`, 'g');
        stackTemplateResourcesString = stackTemplateResourcesString.replaceAll(outputRegexp, `"${stackOutputValue}"`);
      } else if (GET_ATT in value && Array.isArray(value[GET_ATT])) {
        logicalResourceId = value[GET_ATT][0];
      } else {
        return;
      }
      assert(logicalResourceId);

      // Replace Fn:GetAtt references using stack output values
      const fnGetAttRegExp = new RegExp(`{"${GET_ATT}":\\["${logicalResourceId}","(?<AttributeName>\\w+)"]}`, 'g');
      const fnGetAttRegExpResult = stackTemplateResourcesString.matchAll(fnGetAttRegExp).next();
      if (!fnGetAttRegExpResult.done) {
        const resourceType = this.template.Resources[logicalResourceId].Type as CFN_RESOURCE_TYPES;
        const attributeName = fnGetAttRegExpResult.value.groups?.AttributeName;
        assert(attributeName);
        const resource = this.getResourceAttribute(attributeName as AWS_RESOURCE_ATTRIBUTES, resourceType, stackOutputValue);
        if (resource) {
          stackTemplateResourcesString = stackTemplateResourcesString.replaceAll(fnGetAttRegExp, this.buildFnGetAttReplace(resource));
        }
      }
    });

    // If not available in outputs, try to replace with their physical id counterparts.
    stackTemplateResourcesString = this.tryReplaceLogicalResourceRefWithPhysicalId(stackTemplateResourcesString, stackResources);

    clonedStackTemplate.Resources = JSON.parse(stackTemplateResourcesString);
    Object.entries(clonedStackTemplate.Outputs).forEach(([outputKey]) => {
      const stackOutputValue = stackOutputs?.find((op) => op.OutputKey === outputKey)?.OutputValue;
      assert(stackOutputValue);
      clonedStackTemplate.Outputs[outputKey].Value = stackOutputValue;
    });

    return clonedStackTemplate;
  }

  /**
   * Currently, we only look for Fn:GetAtt references in the template and try to replace with physical resource ids (if they are not available in outputs)
   * before performing the refactor. We can expand to look for other cases if need be.
   * If this function expands, we can always move it into its own resolver.
   * @param stackTemplateResourcesString
   * @param stackResources
   * @private
   */
  private tryReplaceLogicalResourceRefWithPhysicalId(stackTemplateResourcesString: string, stackResources: StackResource[]) {
    const fnGetAttRegExp = new RegExp(`{"${GET_ATT}":\\["(?<LogicalResourceId>\\w+)","(?<AttributeName>\\w+)"]}`, 'g');
    const fnGetAttRegExpResult = stackTemplateResourcesString.matchAll(fnGetAttRegExp);

    for (const fnGetAttRegExpResultItem of fnGetAttRegExpResult) {
      const groups = fnGetAttRegExpResultItem.groups;
      if (groups && groups.LogicalResourceId) {
        const stackResourceWithMatchingLogicalId = stackResources.find(
          (resource) => resource.LogicalResourceId === groups.LogicalResourceId,
        );
        if (stackResourceWithMatchingLogicalId) {
          const fnGetAttRegExpPerLogicalId = new RegExp(`{"${GET_ATT}":\\["${groups.LogicalResourceId}","(?<AttributeName>\\w+)"]}`, 'g');
          const stackResourcePhysicalId = stackResourceWithMatchingLogicalId.PhysicalResourceId;
          assert(stackResourcePhysicalId);

          // Kinesis streams require their ARN to be exposed in CloudFormation outputs.
          // The physical resource ID for Kinesis streams is the stream name, not the ARN.
          if (
            stackResourceWithMatchingLogicalId.ResourceType === 'AWS::Kinesis::Stream' &&
            groups.AttributeName === 'Arn' &&
            !stackResourcePhysicalId.startsWith('arn:aws:kinesis')
          ) {
            throw new Error(
              `Kinesis stream ARN must be exposed in CloudFormation outputs. ` +
                `Found physical resource ID '${stackResourcePhysicalId}' for logical resource '${groups.LogicalResourceId}' which is not a valid ARN. ` +
                `Please add an output with Fn::GetAtt for the Kinesis stream's Arn attribute.`,
            );
          }

          if (groups.AttributeName === 'Arn') {
            // Few resources like SQS have their physical ids as their HTTP URLs. We need to construct the arn manually in such cases.
            const resourceId = stackResourcePhysicalId.startsWith('http') ? stackResourcePhysicalId.split('/')[2] : stackResourcePhysicalId;
            const resourceArn = this.getResourceAttribute(
              groups.AttributeName,
              stackResourceWithMatchingLogicalId.ResourceType as CFN_RESOURCE_TYPES,
              resourceId,
            );
            if (resourceArn) {
              stackTemplateResourcesString = stackTemplateResourcesString.replaceAll(fnGetAttRegExpPerLogicalId, `"${resourceArn.Arn}"`);
            } else {
              stackTemplateResourcesString = stackTemplateResourcesString.replaceAll(
                fnGetAttRegExpPerLogicalId,
                `"${stackResourcePhysicalId}"`,
              );
            }
          } else {
            stackTemplateResourcesString = stackTemplateResourcesString.replaceAll(
              fnGetAttRegExpPerLogicalId,
              `"${stackResourcePhysicalId}"`,
            );
          }
        }
      }
    }
    return stackTemplateResourcesString;
  }

  /**
   * Get resource attribute based on attribute name, resource type and resource identifier.
   * Only Arn is supported for now since that is what is used in gen1 and gen2 stacks for Auth and Storage categories.
   * @param attributeName
   * @param resourceType
   * @param resourceIdentifier
   * @private
   */
  private getResourceAttribute(
    attributeName: AWS_RESOURCE_ATTRIBUTES,
    resourceType: CFN_RESOURCE_TYPES,
    resourceIdentifier: string,
  ): Record<string, string> | undefined {
    switch (attributeName) {
      case 'Arn': {
        switch (resourceType) {
          case 'AWS::S3::Bucket':
            return {
              Arn: `arn:aws:s3:::${resourceIdentifier}`,
            };
          case 'AWS::Cognito::UserPool':
            return {
              Arn: `arn:aws:cognito-idp:${this.region}:${this.accountId}:userpool/${resourceIdentifier}`,
            };
          case 'AWS::IAM::Role':
            return {
              // output is already in ARN format
              Arn: resourceIdentifier.startsWith('arn:aws:iam')
                ? resourceIdentifier
                : `arn:aws:iam::${this.accountId}:role/${resourceIdentifier}`,
            };
          case 'AWS::SQS::Queue':
            return {
              Arn: `arn:aws:sqs:${this.region}:${this.accountId}:${resourceIdentifier}`,
            };
          case 'AWS::Lambda::Function':
            return {
              Arn: `arn:aws:lambda:${this.region}:${this.accountId}:function:${resourceIdentifier}`,
            };
          case 'AWS::Kinesis::Stream':
            return {
              // output is already in ARN format
              Arn: resourceIdentifier,
            };
          default:
            return undefined;
        }
      }
      default:
        return undefined;
    }
  }

  /**
   * Build a custom replace function to replace Fn::GetAtt references with resource attribute values.
   * @param record
   * @private
   */
  private buildFnGetAttReplace(record: Record<string, string>) {
    return (_match: string, _p1: string, _offset: number, _text: string, groups: Record<string, string>) =>
      `"${record[groups.AttributeName]}"`;
  }
}

export default CfnOutputResolver;
