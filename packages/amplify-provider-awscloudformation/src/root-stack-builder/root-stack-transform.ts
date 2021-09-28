import { AmplifyRootStackTemplate } from './types';
import { $TSContext, CFNTemplateFormat, Template, pathManager, writeCFNTemplate, buildOverrideDir } from 'amplify-cli-core';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';
import { RootStackSythesizer } from './stack-synthesizer';
import { App } from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';
import * as amplifyPrinter from 'amplify-prompts';

export class AmplifyRootStackTransform {
  private app: App | undefined;
  private _rootTemplateObj: AmplifyRootStack; // Props to modify Root stack data
  private _synthesizer: RootStackSythesizer;
  private _synthesizerOutputs: RootStackSythesizer;
  private _rootTemplateObjOutputs: AmplifyRootStackOutputs;
  private _resourceName: string;

  constructor(resourceName: string) {
    this._resourceName = resourceName;
    this._synthesizer = new RootStackSythesizer();
    this.app = new App();
    this._synthesizerOutputs = new RootStackSythesizer();
  }

  public async transform(context: $TSContext): Promise<Template> {
    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateRootStackTemplate();

    // apply override on Amplify Object having CDK Constructs for Root Stack
    if (context.input.command !== 'init') {
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

  private applyOverride = async () => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideFilePath = path.join(backendDir, this._resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideFilePath).catch(error => {
      amplifyPrinter.printer.warn(`Skipping build as ${error.message}`);
      return false;
    });
    // skip if packageManager or override.ts not found
    if (isBuild) {
      const { overrideProps } = await import(path.join(overrideFilePath, 'build', 'override.js')).catch(error => {
        amplifyPrinter.formatter.list([
          'No override File Found',
          `To override ${this._resourceName} run amplify override auth ${this._resourceName} `,
        ]);
        return undefined;
      });

      // pass stack object
      const rootStackTemplateObj = this._rootTemplateObj as AmplifyRootStackTemplate;
      //TODO: Check Script Options
      if (typeof overrideProps === 'function' && overrideProps) {
        try {
          this._rootTemplateObj = overrideProps(rootStackTemplateObj);

          //The vm module enables compiling and running code within V8 Virtual Machine contexts. The vm module is not a security mechanism. Do not use it to run untrusted code.
          // const script = new vm.Script(overrideCode);
          // script.runInContext(vm.createContext(cognitoStackTemplateObj));
          return;
        } catch (error) {
          throw new Error(error);
        }
      }
    }
  };

  /**
   * Generates Root stack Template
   * @returns CFN Template
   */
  private generateRootStackTemplate = async () => {
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
      'UnAuthRoleArn',
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
        value: cdk.Fn.ref('AuthRoleName'),
      },
      'AuthRoleName',
    );

    this._rootTemplateObjOutputs.addCfnOutput(
      {
        value: cdk.Fn.ref('UnauthRoleName'),
      },
      'UnauthRoleName',
    );
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
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

  private saveBuildFiles = async (context: $TSContext, template: Template) => {
    const rootStackFileName = `root-cloudformation-stack.json`;
    const rootstackFilePath = path.join(pathManager.getBackendDirPath(), this._resourceName, 'build', rootStackFileName);
    // write CFN template
    writeCFNTemplate(template, rootstackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
  };

  public getRootStack(): AmplifyRootStack {
    if (this._rootTemplateObj != null) {
      return this._rootTemplateObj;
    } else {
      throw new Error('Root Stack Template doesnt exist');
    }
  }
}
