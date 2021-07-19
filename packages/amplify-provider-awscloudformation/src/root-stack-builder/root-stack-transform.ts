import * as path from 'path';
import { AmplifyRootStackTemplate } from './types';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';
import { RootStackSythesizer } from './stackSynthesizer';
import { App } from '@aws-cdk/core';
import * as cdk from '@aws-cdk/core';

export enum CommandType {
  'PUSH',
  'INIT',
  'PRE_INIT',
}

type RootStackOptions = {
  rootStackFileName: string;
  event: CommandType;
  overrideDir?: string;
};

export type RootStackConfig = {
  stackFileName: string;
};

export type ResourceConfig = {
  resourceName: string;
  categoryName: string;
  stackFileName: string;
};

export interface RootStackTransformOptions {
  //inputParser: IInputParser[];  // not needed for root stack
  resourceConfig: RootStackConfig;
  deploymentOptions?: DeploymentOptions;
  overrideOptions?: OverrideOptions;
  cfnModifiers: Function;
}

export interface DeploymentOptions {
  templateStack?: Template;
  rootFilePath: string;
}

export interface OverrideOptions {
  overrideFnPath: string;
}

export class AmplifyRootStackTransform {
  private app: App | undefined;
  private _rootTemplateObj: AmplifyRootStack; // Props to modify Root stack data
  private _resourceConfig: RootStackConfig; // Config about resource to override (in this case only root stack)
  private _rootStackOptions: RootStackOptions; // options to help generate  cfn template
  private _command: CommandType;
  private _synthesizer: RootStackSythesizer;
  private _synthesizerOutputs: RootStackSythesizer;
  private _rootTemplateObjOutputs: AmplifyRootStackOutputs;
  private _deploymentOptions: DeploymentOptions;
  private _overrideProps: OverrideOptions;
  private _cfnModifiers: Function;

  constructor(options: RootStackTransformOptions, command: CommandType) {
    this._resourceConfig = options.resourceConfig;
    this._command = command;
    this._synthesizer = new RootStackSythesizer();
    this.app = new App();
    this._synthesizerOutputs = new RootStackSythesizer();
    this._deploymentOptions = options.deploymentOptions;
    this._overrideProps = options.overrideOptions;
    this._cfnModifiers = options.cfnModifiers;
  }

  public async transform(): Promise<Template> {
    // parse Input data
    this._rootStackOptions = await this.getInput(); // get RootStackOptions from cli-inputs.json (not required for root Stack)

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateRootStackTemplate();

    // apply override on Amplify Object having CDK Constructs for Root Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    this._cfnModifiers(template);

    // save stack
    if (this._command === CommandType.PUSH) {
      await this.deployOverrideStacksToDisk({
        templateStack: template,
        rootFilePath: this._deploymentOptions.rootFilePath,
      });
    }
    return template;
  }

  private applyOverride = async () => {
    if (this._rootStackOptions.event === CommandType.PUSH) {
      const { overrideProps } = await import(this._overrideProps.overrideFnPath);
      if (typeof overrideProps === 'function' && overrideProps != null) {
        this._rootTemplateObj = overrideProps(this._rootTemplateObj as AmplifyRootStackTemplate);
      } else {
        console.log('There is no override setup yet for Root Stack. To enable override : Run amplify override root');
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private getInput = async (): Promise<RootStackOptions> => {
    if (this._command === CommandType.INIT || this._command === CommandType.PRE_INIT) {
      const buildConfig: RootStackOptions = {
        event: this._command,
        rootStackFileName: this._resourceConfig.stackFileName,
      };
      return buildConfig;
    } else {
      const projectPath = pathManager.findProjectRoot();
      const buildConfig: RootStackOptions = {
        event: this._command,
        rootStackFileName: this._resourceConfig.stackFileName,
        overrideDir: pathManager.getRootOverrideDirPath(projectPath),
      };
      return buildConfig;
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

  private deployOverrideStacksToDisk = async (props: DeploymentOptions) => {
    JSONUtilities.writeJson(props.rootFilePath, props.templateStack);
  };

  public getRootStack(): AmplifyRootStack {
    if (this._rootTemplateObj != null) {
      return this._rootTemplateObj;
    } else {
      throw new Error('Root Stack Template doesnt exist');
    }
  }
}
