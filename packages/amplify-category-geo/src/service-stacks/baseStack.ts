import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { $TSObject } from 'amplify-cli-core';

/**
 * template Mappings
 */
export type TemplateMappings = {
  RegionMapping: $TSObject;
};

/**
 * Base stack to synthesize geo CFN
 */
export class BaseStack extends cdk.Stack {
  protected parameters: Map<string, cdk.CfnParameter>;
  protected regionMapping: cdk.CfnMapping;

  constructor(scope: Construct, id: string, props: TemplateMappings) {
    super(scope, id);
    this.parameters = new Map();

    this.regionMapping = new cdk.CfnMapping(this, 'RegionMapping', {
      mapping: props.RegionMapping,
    });
  }

  /**
   * construct the stack CFN input parameters
   */
  constructInputParameters(parameterNames: Array<string>): Map<string, cdk.CfnParameter> {
    const parametersMap: Map<string, cdk.CfnParameter> = new Map();
    parameterNames.forEach(parameterName => {
      const inputParameter = new cdk.CfnParameter(this, parameterName, { type: 'String' });
      parametersMap.set(parameterName, inputParameter);
    });
    return parametersMap;
  }

  /**
   * converts to cfn
   */
  toCloudFormation() {
    const cfn = this._toCloudFormation();
    return cfn;
  }
}
