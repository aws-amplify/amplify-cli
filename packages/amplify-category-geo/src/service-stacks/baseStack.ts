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
   * converts to cfn
   */
  toCloudFormation = (): $TSAny => {
    const root = this.node.root as cdk.Stage;
    const assembly = root.synth();
    if (!this.nestedStackParent) {
      return assembly.getStackArtifact(this.artifactId).template;
    }
    // if this is a nested stack ( i.e. it has a parent), then just read the template as a string
    return JSON.parse(fs.readFileSync(path.join(assembly.directory, this.templateFile)).toString('utf-8'));
  }
}

// force major version bump for cdk v2
