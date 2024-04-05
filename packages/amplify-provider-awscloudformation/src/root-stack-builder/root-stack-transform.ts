import { AmplifyRootStackTemplate, getProjectInfo } from '@aws-amplify/cli-extensibility-helper';
import * as cdk from 'aws-cdk-lib';
import {
  $TSContext,
  AmplifyError,
  AmplifyFault,
  buildOverrideDir,
  CFNTemplateFormat,
  pathManager,
  runOverride,
  Template,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';
import { RootStackSynthesizer } from './stack-synthesizer';

/**
 * class to manage stack lifecycle
 */
export class AmplifyRootStackTransform {
  private app: cdk.App | undefined;
  private _rootTemplateObj: AmplifyRootStack; // Props to modify Root stack data
  private _synthesizer: RootStackSynthesizer;
  private _synthesizerOutputs: RootStackSynthesizer;
  private _rootTemplateObjOutputs: AmplifyRootStackOutputs;
  private _resourceName: string;

  constructor(resourceName: string) {
    this._resourceName = resourceName;
    this._synthesizer = new RootStackSynthesizer();
    this.app = new cdk.App();
    this._synthesizerOutputs = new RootStackSynthesizer();
  }

  /**
   * transform root stack, applying any overrides
   */
  public async transform(context: $TSContext): Promise<Template> {
    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateRootStackTemplate();

    // apply override on Amplify Object having CDK Constructs for Root Stack
    // enabling overrides for hosting when forcepush flag is used with init
    if (context.input.command !== 'init' || (context.input.command === 'init' && context?.input?.options?.forcePush === true)) {
      await this.applyOverride();
    }

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // save stack
    if (context.input.command !== 'init') {
      await this.saveBuildFiles(context, template);
    }
    return template;
  }

  private applyOverride = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = path.join(backendDir, this._resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir);
    // skip if packageManager or override.ts not found
    if (isBuild) {
      const projectInfo = getProjectInfo();
      try {
        await runOverride(overrideDir, this._rootTemplateObj, projectInfo);
      } catch (err) {
        throw new AmplifyError(
          'InvalidOverrideError',
          {
            message: `Executing overrides failed.`,
            details: err.message,
            resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
          },
          err,
        );
      }
    }
  };

  /**
   * Generates Root stack Template
   * @returns CFN Template
   */
  private generateRootStackTemplate = async (): Promise<void> => {
    this._rootTemplateObj = new AmplifyRootStack(this.app, 'AmplifyRootStack', { synthesizer: this._synthesizer });

    this._rootTemplateObj.addCfnParameter(
      {
        type: 'String',
        description: 'Name of the common deployment bucket provided by the parent stack',
        default: 'DeploymentBucket',
      },
      'DeploymentBucketName',
    );

    this._rootTemplateObj.addCfnParameter(
      {
        type: 'String',
        description: 'Name of the common deployment bucket provided by the parent stack',
        default: 'AuthRoleName',
      },
      'AuthRoleName',
    );

    this._rootTemplateObj.addCfnParameter(
      {
        type: 'String',
        description: 'Name of the common deployment bucket provided by the parent stack',
        default: 'UnAuthRoleName',
      },
      'UnauthRoleName',
    );

    // Add Outputs
    this._rootTemplateObj.addCfnOutput(
      {
        description: 'CloudFormation provider root stack Region',
        value: cdk.Fn.ref('AWS::Region'),
        exportName: cdk.Fn.sub('${AWS::StackName}-Region'),
      },
      'Region',
    );

    this._rootTemplateObj.addCfnOutput(
      {
        description: 'CloudFormation provider root stack ID',
        value: cdk.Fn.ref('AWS::StackName'),
        exportName: cdk.Fn.sub('${AWS::StackName}-StackName'),
      },
      'StackName',
    );

    this._rootTemplateObj.addCfnOutput(
      {
        description: 'CloudFormation provider root stack name',
        value: cdk.Fn.ref('AWS::StackId'),
        exportName: cdk.Fn.sub('${AWS::StackName}-StackId'),
      },
      'StackId',
    );

    this._rootTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.getAtt('AuthRole', 'Arn').toString(),
      },
      'AuthRoleArn',
    );

    this._rootTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.getAtt('UnauthRole', 'Arn').toString(),
      },
      'UnauthRoleArn',
    );

    await this._rootTemplateObj.generateRootStackResources();

    // add another stack as above stack duplicate logical Ids
    this._rootTemplateObjOutputs = new AmplifyRootStackOutputs(this.app, 'AmplifyRootStackOutputs', {
      synthesizer: this._synthesizerOutputs,
    });
    this._rootTemplateObjOutputs.addCfnOutput(
      {
        description: 'CloudFormation provider root stack deployment bucket name',
        value: cdk.Fn.ref('DeploymentBucketName'),
        exportName: cdk.Fn.sub('${AWS::StackName}-DeploymentBucketName'),
      },
      'DeploymentBucketName',
    );

    this._rootTemplateObjOutputs.addCfnOutput(
      {
        value: cdk.Fn.ref('AuthRole'),
      },
      'AuthRoleName',
    );

    this._rootTemplateObjOutputs.addCfnOutput(
      {
        value: cdk.Fn.ref('UnauthRole'),
      },
      'UnauthRoleName',
    );
  };

  /**
   * return CFN templates synthesized by app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this.app?.synth();
    const templates = this._synthesizer.collectStacks();
    const templatesOutput = this._synthesizerOutputs.collectStacks();
    const cfnRootStack: Template = templates.get('AmplifyRootStack');
    const cfnRootStackOutputs: Template = templatesOutput.get('AmplifyRootStackOutputs');
    Object.assign(cfnRootStack.Outputs, cfnRootStackOutputs.Outputs);
    return cfnRootStack;
  };

  private saveBuildFiles = async (context: $TSContext, template: Template): Promise<void> => {
    const rootStackFileName = 'root-cloudformation-stack.json';
    const rootStackFilePath = path.join(pathManager.getBackendDirPath(), this._resourceName, 'build', rootStackFileName);
    // write CFN template
    await writeCFNTemplate(template, rootStackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
      minify: context.input.options?.minify,
    });
  };

  /**
   * return root stack
   */
  public getRootStack(): AmplifyRootStack {
    if (this._rootTemplateObj) {
      return this._rootTemplateObj;
    }

    throw new AmplifyFault('RootStackNotFoundFault', {
      message: `Root Stack Template doesn't exist.`,
    });
  }
}
