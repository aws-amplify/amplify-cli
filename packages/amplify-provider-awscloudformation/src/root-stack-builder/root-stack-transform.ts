import * as path from 'path';
import { AmplifyRootStackTemplate } from './types';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import { AmplifyRootStack, AmplifyRootStackOutputs } from './root-stack-builder';
import { RootStackSythesizer } from './stackSynthesizer';
import { App } from '@aws-cdk/core';

export enum CommandType {
  'PUSH',
  'INIT',
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
}

export interface DeploymentOptions {
  templateStack: Template;
}

export class AmplifyRootStackTransform {
  private app: App | undefined;
  private _rootTemplateObj: AmplifyRootStackTemplate; // Props to modify Root stack data
  private _resourceConfig: RootStackConfig; // Config about resource to override (in this case only root stack)
  private _rootStackOptions: RootStackOptions; // options to help generate  cfn template
  private _command: CommandType;
  private _synthesizer: RootStackSythesizer;
  private _synthesizerOutputs: RootStackSythesizer;

  constructor(options: RootStackTransformOptions, command: CommandType) {
    this._resourceConfig = options.resourceConfig;
    this._command = command;
    this._rootTemplateObj = {};
    this._synthesizer = new RootStackSythesizer();
    this._synthesizerOutputs = new RootStackSythesizer();
  }

  public async transform(): Promise<Template> {
    // parse Input data
    this.app = new App();
    this._rootStackOptions = await this.getInput(); // get RootStackOptions from cli-inputs.json (not required for root Stack)

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateRootStackTemplate();

    // apply override on Amplify Object having CDK Constructs for Root Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // save stack
    if (this._command === CommandType.PUSH) {
      await this.deployOverrideStacksToDisk({
        templateStack: template,
      });
    }
    return template;
  }

  private applyOverride = async () => {
    if (this._rootStackOptions.event === CommandType.PUSH) {
      // add check here to see if the override folder is present or not
      const projectPath = pathManager.findProjectRoot();
      const overridePath = pathManager.getRootOverrideDirPath(projectPath);
      const fn = await import(path.join(overridePath, 'build', 'override.js'));
      if (typeof fn.overrideProps === 'function' && fn.overrideProps != null) {
        this._rootTemplateObj = fn.overrideProps(this._rootTemplateObj);
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
    if (this._command === CommandType.INIT) {
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
    new AmplifyRootStack(this.app, 'AmplifyRootStack', { synthesizer: this._synthesizer }, this._rootTemplateObj);
    new AmplifyRootStackOutputs(this.app, 'AmplifyRootStackOutputs', { synthesizer: this._synthesizerOutputs }, this._rootTemplateObj);
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this.app?.synth({ force: true, skipValidation: true });
    console.log(this._rootTemplateObj);
    const templates = this._synthesizer.collectStacks();
    const templatesOutput = this._synthesizerOutputs.collectStacks();
    const cfnRootStack: Template = templates.get('AmplifyRootStack');
    const cfnRootStackOutputs: Template = templatesOutput.get('AmplifyRootStackOutputs');
    Object.assign(cfnRootStack.Outputs, cfnRootStackOutputs.Outputs);
    return cfnRootStack;
  };

  private deployOverrideStacksToDisk = async (props: DeploymentOptions) => {
    const rootFilePath = path.join(pathManager.getBackendDirPath(), 'awscloudformation', 'build', this._resourceConfig.stackFileName);
    JSONUtilities.writeJson(rootFilePath, props.templateStack);
  };
}
