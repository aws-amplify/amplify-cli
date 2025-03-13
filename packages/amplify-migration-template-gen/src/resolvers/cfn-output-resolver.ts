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

    clonedStackTemplate.Resources = JSON.parse(stackTemplateResourcesString);
    Object.entries(clonedStackTemplate.Outputs).forEach(([outputKey]) => {
      const stackOutputValue = stackOutputs?.find((op) => op.OutputKey === outputKey)?.OutputValue;
      assert(stackOutputValue);
      clonedStackTemplate.Outputs[outputKey].Value = stackOutputValue;
    });

    return clonedStackTemplate;
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
          default:
            return undefined;
        }
      }
      default:
        return undefined;
    }
  }

  /**
   * Build a custom replacer function to replace Fn::GetAtt references with resource attribute values.
   * @param record
   * @private
   */
  private buildFnGetAttReplace(record: Record<string, string>) {
    return (_match: string, _p1: string, _offset: number, _text: string, groups: Record<string, string>) =>
      `"${record[groups.AttributeName]}"`;
  }
}

export default CfnOutputResolver;
