import { AWS_RESOURCE_ATTRIBUTES, CFN_RESOURCE_TYPES, CFNTemplate } from '../types';
import assert from 'node:assert';
import { Output } from '@aws-sdk/client-cloudformation';

const REF = 'Ref';
const GET_ATT = 'Fn::GetAtt';

/**
 * This class is responsible for resolving logical resource ids in a CloudFormation template
 * with their corresponding stack outputs.
 */
class CfnOutputResolver {
  constructor(private readonly template: CFNTemplate, private readonly region: string, private readonly accountId: string) {}

  public resolve(logicalResourceIds: string[], stackOutputs: Output[]): CFNTemplate {
    const resources = this.template?.Resources;
    assert(resources);
    let stackTemplateString = JSON.stringify(this.template);
    const stackTemplateOutputs = this.template?.Outputs;
    assert(stackOutputs);
    assert(stackTemplateOutputs);

    for (const logicalResourceId of logicalResourceIds) {
      Object.entries(stackTemplateOutputs).forEach(([outputKey, outputValue]) => {
        const value = outputValue.Value;
        const stackOutputValue = stackOutputs?.find((op) => op.OutputKey === outputKey)?.OutputValue;
        assert(stackOutputValue);

        // Replace logicalId references using stack output values
        if (typeof value === 'object' && REF in value && value[REF] === logicalResourceId) {
          const outputRegexp = new RegExp(`{"${REF}":"${logicalResourceId}"}`, 'g');
          stackTemplateString = stackTemplateString.replaceAll(outputRegexp, `"${stackOutputValue}"`);

          // Replace Fn:GetAtt references using stack output values
          const fnGetAttRegExp = new RegExp(`{"${GET_ATT}":\\["${logicalResourceId}","(?<AttributeName>\\w+)"]}`, 'g');
          const fnGetAttRegExpResult = stackTemplateString.matchAll(fnGetAttRegExp).next();
          const resourceType = this.template.Resources[logicalResourceId].Type as CFN_RESOURCE_TYPES;
          if (!fnGetAttRegExpResult.done) {
            const attributeName = fnGetAttRegExpResult.value.groups?.AttributeName;
            assert(attributeName);
            const resource = this.getResourceAttribute(attributeName as AWS_RESOURCE_ATTRIBUTES, resourceType, stackOutputValue);
            stackTemplateString = stackTemplateString.replaceAll(fnGetAttRegExp, this.buildFnGetAttReplace(resource));
          }
        }
      });
    }

    return JSON.parse(stackTemplateString);
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
  ): Record<string, string> {
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
          default:
            throw new Error(`getResourceAttribute not implemented for ${resourceType}`);
        }
      }
      default:
        throw new Error(`getResourceAttribute not implemented for ${attributeName}`);
    }
  }

  /**
   * Build a custom replacer function to replace Fn::GetAtt references with resource attribute values.
   * @param resource
   * @param record
   * @private
   */
  private buildFnGetAttReplace(record: Record<string, string>) {
    return (_match: string, _p1: string, _offset: number, _text: string, groups: Record<string, string>) =>
      `"${record[groups.AttributeName]}"`;
  }
}

export default CfnOutputResolver;
