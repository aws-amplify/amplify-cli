import { Template } from 'cloudform-types';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import * as path from 'path';
import { AmplifyUserPoolGroupStack } from './auth-user-pool-group-stack-builder';
import { AmplifyUserPoolGroupStackTemplate } from './types';

export enum CommandType {
  'ADD',
  'UPDATE',
  'REMOVE',
}

export const authUserPoolGroupStackFileName: string = 'template.json';

export type UserPoolGroupMetadata = {
  groupName: string;
  precedence: number;
  customPolicies?: any;
};

export type AmplifyUserPoolGroupStackOptions = {
  groups: UserPoolGroupMetadata[];
  identityPoolName?: string;
  cognitoResourceName: string;
};

export type ResourceConfig = {
  resourceName: string;
  categoryName: string;
  stackFileName: string;
  serviceName: string;
};

export interface AmplifyUserPoolGroupTransformOptions {
  resourceConfig: ResourceConfig;
  deploymentOptions: DeploymentOptions;
  overrideOptions: OverrideOptions;
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

export class AmplifyUserPoolGroupTransform {
  private app: cdk.App;
  private _resourceConfig: ResourceConfig; // Config about resource to override
  private _userPoolGroupTemplateObj: AmplifyUserPoolGroupStack; // Props to modify Root stack data
  private _userPoolGroupStackOptions: AmplifyUserPoolGroupStackOptions; // options to help generate  cfn template
  private _command: CommandType;
  private _synthesizer: AuthStackSythesizer;
  private _deploymentOptions: DeploymentOptions;
  private _overrideProps: OverrideOptions;
  private _cfnModifiers?: Function;
  private _authInputState: AuthInputState;

  constructor(options: AmplifyUserPoolGroupTransformOptions, command: CommandType) {
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
      service: this._resourceConfig.serviceName,
    });
  }

  public async transform(): Promise<Template> {
    // parse Input data
    this._userPoolGroupStackOptions = await this.getInput();

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateResources();

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

  /**
   * Generates CFN REsources for Auth
   * @returns CFN Template
   */

  generateResources = async () => {
    this._userPoolGroupTemplateObj = new AmplifyUserPoolGroupStack(this.app, 'AmplifyUserPoolGroupStack', {
      synthesizer: this._synthesizer,
    });

    // add CFN parameters
    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'authRoleArn',
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'unauthRoleArn',
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${this._userPoolGroupStackOptions.cognitoResourceName}UserPoolId`,
    );

    if (this._userPoolGroupStackOptions.identityPoolName) {
      this._userPoolGroupTemplateObj.addCfnParameter(
        {
          type: 'String',
        },
        `auth${this._userPoolGroupStackOptions.cognitoResourceName}IdentityPoolId`,
      );
    }

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${this._userPoolGroupStackOptions.cognitoResourceName}appClientID`,
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${this._userPoolGroupStackOptions.cognitoResourceName}appClientIDWeb`,
    );

    // add CFN condition
    this._userPoolGroupTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(this._userPoolGroupTemplateObj.getCfnParameter('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );

    // generate resources
    this._userPoolGroupTemplateObj.generateUserPoolGroupResources(this._userPoolGroupStackOptions);

    // generate CFN outputs
    //TODO: same output params as root stack
    if (this._userPoolGroupStackOptions.identityPoolName) {
      this._userPoolGroupStackOptions.groups.forEach(group => {
        this._userPoolGroupTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString(),
          },
          `${group.groupName}GroupRoleOutput`,
        );
      });
    }
  };

  private applyOverride = async () => {
    if (this._command === CommandType.UPDATE) {
      const { overrideProps } = await import(this._overrideProps.overrideFnPath);
      if (typeof overrideProps === 'function' && overrideProps) {
        // await buildOverrideDir(this._overrideProps!.overrideDir);
        this._userPoolGroupTemplateObj = overrideProps(this._userPoolGroupTemplateObj as AmplifyUserPoolGroupStackTemplate);
      } else {
        console.log('There is no override setup yet for Root Stack. To enable override : Run amplify override root');
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private getInput = async (): Promise<AmplifyUserPoolGroupStackOptions> => {
    const cliInputs = this._authInputState._authInputPayload!;
    const resourceDirPath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
    const groups = JSONUtilities.readJson(resourceDirPath, { throwIfNotExist: true })!;

    const identityPoolName = cliInputs.identityPoolName;
    return {
      groups: groups as UserPoolGroupMetadata[],
      identityPoolName,
      cognitoResourceName: cliInputs.resourceName!,
    };
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this.app.synth();
    const templates = this._synthesizer.collectStacks();
    return templates.get('AmplifyUserPoolGroupStack')!;
  };

  private deployOverrideStacksToDisk = async (props: DeploymentOptions) => {
    JSONUtilities.writeJson(props.rootFilePath, props.templateStack);
  };
}
