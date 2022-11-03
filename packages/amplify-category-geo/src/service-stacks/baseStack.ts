import { $TSAny, $TSObject } from 'amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs-extra';
import * as path from 'path';
/**
 *  cfn template mapping type
 */
export type TemplateMappings = {
  RegionMapping: $TSObject;
};

/**
 * base class for cfn stack generation
 */
export class BaseStack extends cdk.Stack {
  protected parameters: Map<string, cdk.CfnParameter>;
  protected regionMapping: cdk.CfnMapping;

  constructor(scope: Construct, id: string, props: TemplateMappings) {
    super(scope, id, { synthesizer: new cdk.LegacyStackSynthesizer() });
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
   * This function renderers a full CFN template for this stack.
   * It is inspired by
   * https://github.com/aws/aws-cdk/blob/bd056d1d38a2d3f43efe4f857c4d38b30fb9b681/packages/%40aws-cdk/assertions/lib/template.ts#L298-L310.
   * This replaces private prepareApp (from CDK v1) and this._toCloudFormation() (the latter does not function properly without the former).
   */
  toCloudFormation = (): $TSAny => {
    const root = this.node.root as cdk.Stage;
    const assembly = root.synth();
    if (!this.nestedStackParent) {
      return assembly.getStackArtifact(this.artifactId).template;
    }
    // if this is a nested stack ( i.e. it has a parent), then just read the template as a string
    const template = fs.readFileSync(path.join(assembly.directory, this.templateFile));
    return JSON.parse(template.toString('utf-8'));
  }
}

// force major version bump for cdk v2
