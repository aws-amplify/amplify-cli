import { Template } from 'cloudform-types';
import { JSONUtilities } from 'amplify-cli-core';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
// import { buildOverrideDir } from '../utils/override-skeleton-generator';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { AmplifyAuthStackTemplate } from './types';
import { generateNestedAuthTriggerTemplate } from '../utils/generate-auth-trigger-template';
import { category } from '../constants';

export enum CommandType {
  'ADD',
  'UPDATE',
  'REMOVE',
}

export const authCognitoStackFileName: string = 'auth-template.yml';

type AmplifyAuthStackOptions = {
  authStackFileName: string;
  event: CommandType;
  authStackInputPayload: ServiceQuestionsResult;
  overrideDir?: string;
};

export type AmplifyAuthStackConfig = {
  stackFileName: string;
};

export type ResourceConfig = {
  resourceName: string;
  categoryName: string;
  stackFileName: string;
};

export interface AmplifyAuthTransformOptions {
  resourceConfig: ResourceConfig;
  deploymentOptions: DeploymentOptions;
  overrideOptions?: OverrideOptions;
  cfnModifiers?: Function;
}

export interface DeploymentOptions {
  templateStack?: Template;
  rootFilePath: string;
}

export interface OverrideOptions {
  overrideFnPath: string;
  overrideDir: string;
}

export class AmplifyAuthTransform {
  private app: cdk.App | undefined;
  private _authTemplateObj: AmplifyAuthCognitoStack | undefined; // Props to modify Root stack data
  private _resourceConfig: ResourceConfig; // Config about resource to override
  private _authStackOptions: AmplifyAuthStackOptions | undefined; // options to help generate  cfn template
  private _command: CommandType;
  private _synthesizer: AuthStackSythesizer;
  private _deploymentOptions: DeploymentOptions | undefined;
  private _overrideProps: OverrideOptions | undefined;
  private _cfnModifiers: Function | undefined;
  private _authInputState: AuthInputState;

  constructor(options: AmplifyAuthTransformOptions, command: CommandType) {
    this._resourceConfig = options.resourceConfig;
    this._command = command;
    this._synthesizer = new AuthStackSythesizer();
    this.app = new cdk.App();
    this._deploymentOptions = options.deploymentOptions;
    this._overrideProps = options.overrideOptions;
    this._cfnModifiers = options.cfnModifiers;
    this._authInputState = AuthInputState.getInstance({
      category: this._resourceConfig.categoryName,
      resourceName: this._resourceConfig.resourceName,
      fileName: this._resourceConfig.stackFileName,
    });
  }

  public async transform(): Promise<Template> {
    // parse Input data
    this._authStackOptions = await this.getInput();

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateAmplifyAuthStackTemplate();

    // apply override on Amplify Object having CDK Constructs for Root Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // check if the cfnModifiers are defined for the Auth Stack
    if (this._cfnModifiers) {
      this._cfnModifiers(template);
    }

    // save stack
    if (this._command === CommandType.ADD || this._command === CommandType.UPDATE) {
      await this.deployOverrideStacksToDisk({
        templateStack: template,
        rootFilePath: this._deploymentOptions!.rootFilePath,
      });
    }
    return template;
  }

  private applyOverride = async () => {
    if (this._command === CommandType.ADD || this._command === CommandType.UPDATE) {
      const { overrideProps } = await import(this._overrideProps!.overrideFnPath);
      if (typeof overrideProps === 'function' && overrideProps) {
        // await buildOverrideDir(this._overrideProps!.overrideDir);
        this._authTemplateObj = overrideProps(this._authTemplateObj as AmplifyAuthStackTemplate);
      } else {
        console.log('There is no override setup yet for Root Stack. To enable override : Run amplify override root');
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private getInput = async (): Promise<AmplifyAuthStackOptions> => {
    return {
      authStackFileName: this._resourceConfig.stackFileName,
      authStackInputPayload: this._authInputState.getCliInputPayload(),
      event: CommandType.ADD,
    };
  };

  /**
   * Generates Root stack Template
   * @returns CFN Template
   */
  private generateAmplifyAuthStackTemplate = async () => {
    this._authTemplateObj = new AmplifyAuthCognitoStack(this.app!, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
    if (this._authInputState._authInputPayload?.triggers) {
      // get Transform for functions
      generateNestedAuthTriggerTemplate(category, this._authInputState._authInputPayload);
      //generateStacksForAuthTriggers(this._authInputState._authInputPayload);
    }
    if (this._authInputState._authInputPayload?.userPoolGroupList) {
      //generateStackforUserPoolGroups(this._authInputState._authInputPayload);
    }
    if (this._authInputState._authInputPayload?.adminQueries) {
      //generateStackForAdminQueries(this._authInputState._authInputPayload);
    }
  };
  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this.app?.synth();
    const templates = this._synthesizer.collectStacks();
    return templates.get('AmplifyAuthCognitoStack')!;
  };

  private deployOverrideStacksToDisk = async (props: DeploymentOptions) => {
    if (this._authStackOptions!.event === CommandType.ADD || this._authStackOptions!.event === CommandType.UPDATE) {
      JSONUtilities.writeJson(props.rootFilePath, props.templateStack);
    }
  };

  public getRootStack(): AmplifyAuthCognitoStack {
    if (this._authTemplateObj != null) {
      return this._authTemplateObj;
    } else {
      throw new Error('Root Stack Template doesnt exist');
    }
  }
}
