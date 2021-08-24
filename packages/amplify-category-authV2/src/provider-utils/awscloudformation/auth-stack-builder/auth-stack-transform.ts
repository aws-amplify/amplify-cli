import { Template } from 'cloudform-types';
import { JSONUtilities } from 'amplify-cli-core';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { AuthStackOptions, ServiceQuestionsResult } from '../service-walkthrough-types';
import { AmplifyAuthCognitoStackTemplate } from './types';
import { generateNestedAuthTriggerTemplate } from '../utils/generate-auth-trigger-template';
import { category } from '../constants';
import { pathManager, FeatureFlags, $TSContext } from 'amplify-cli-core';
import _ from 'lodash';
import * as path from 'path';

export enum CommandType {
  'ADD',
  'UPDATE',
  'REMOVE',
}

export const authCognitoStackFileName: string = 'auth-template.yml';

type AmplifyAuthStackOptions = {
  authStackFileName: string;
  event: CommandType;
  authStackInputPayload: AuthStackOptions;
  overrideDir?: string;
};

export type ResourceConfig = {
  resourceName: string;
  categoryName: string;
  stackFileName: string;
};

export interface AmplifyAuthTransformOptions {
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

export class AmplifyAuthTransform {
  private app: cdk.App;
  private _authTemplateObj: AmplifyAuthCognitoStack; // Props to modify Root stack data
  private _resourceConfig: ResourceConfig; // Config about resource to override
  private _authStackOptions: AmplifyAuthStackOptions; // options to help generate  cfn template
  private _command: CommandType;
  private _synthesizer: AuthStackSythesizer;
  private _deploymentOptions: DeploymentOptions;
  private _overrideProps: OverrideOptions;
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

  public async transform(context: $TSContext): Promise<Template> {
    // parse Input data
    this._authStackOptions = await this.getInput(context);

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
    this._authTemplateObj = new AmplifyAuthCognitoStack(this.app!, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );

    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'authRoleArn',
    );

    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'unauthRoleArn',
    );

    const props = this._authStackOptions?.authStackInputPayload!;

    if (!_.isEmpty(props.dependsOn)) {
      const dependsOn = props.dependsOn;
      dependsOn?.forEach(param => {
        param.attributes.forEach(attribute => {
          this._authTemplateObj!.addCfnParameter(
            {
              type: 'String',
              default: `${param.category}${param.resourceName}${attribute}`,
            },
            `${param.category}${param.resourceName}${attribute}`,
          );
        });
      });
    }

    for (var i = 0; i < Object.keys(props).length; i++) {
      if (typeof Object.values(props)[i] === 'string' || (Object.values(props)[i] && Object.values(props)[i].value)) {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${Object.keys(props)[i]}`,
        );
      }

      if (typeof Object.values(props)[i] === 'boolean') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${Object.keys(props)[i]}`,
        );
      }
      if (typeof Object.values(props)[i] === 'number') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${Object.keys(props)[i]}`,
        );
      }
      if (Object.keys(props)[i] === 'parentStack') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${Object.keys(props)[i]}`,
        );
      }
      if (Array.isArray(Object.values(props)[i])) {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'CommaDelimitedList',
          },
          `${Object.keys(props)[i]}`,
        );
      }
    }

    if (Object.keys(props).includes('hostedUIProviderMeta') && !Object.keys(props).includes('hostedUIProviderCreds')) {
      this._authTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: [],
        },
        'hostedUIProviderCreds',
      );
    }

    // add CFN condition
    this._authTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );

    if (props.authSelections !== 'identityPoolOnly') {
      this._authTemplateObj.addCfnCondition(
        {
          expression: cdk.Fn.conditionEquals(cdk.Fn.ref('userpoolClientGenerateSecret'), true),
        },
        'ShouldOutputAppClientSecrets',
      );
    }
    // generate Resources

    this._authTemplateObj.generateCognitoStackResources(props);

    //generate Output
  };

  private applyOverride = async () => {
    if (this._command === CommandType.ADD || this._command === CommandType.UPDATE) {
      const { overrideProps } = await import(this._overrideProps!.overrideFnPath);
      if (typeof overrideProps === 'function' && overrideProps) {
        // await buildOverrideDir(this._overrideProps!.overrideDir);
        this._authTemplateObj = overrideProps(this._authTemplateObj as AmplifyAuthCognitoStackTemplate);
      } else {
        console.log('There is no override setup yet for Root Stack. To enable override : Run amplify override root');
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private getInput = async (context: $TSContext): Promise<AmplifyAuthStackOptions> => {
    // get the parameters necessary to complete
    // handle dependsOn data

    // determine permissions needed for each trigger module
    if (!_.isEmpty(this._authInputState._authInputPayload!.triggers)) {
      const permissions = await context.amplify.getTriggerPermissions(
        context,
        this._authInputState._authInputPayload?.triggers,
        'auth',
        this._authInputState._authInputPayload!.resourceName!,
      );

      // handle dependsOn data
      const dependsOnKeys = Object.keys(this._authInputState._authInputPayload?.triggers).map(
        i => `${this._authInputState._authInputPayload!.resourceName}${i}`,
      );
      const dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
      return {
        authStackFileName: this._resourceConfig.stackFileName,
        authStackInputPayload: {
          breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
          permissions: permissions,
          dependsOn: dependsOn,
          ...this._authInputState.getCliInputPayload(),
        },
        event: CommandType.ADD,
      };
    }

    return {
      authStackFileName: this._resourceConfig.stackFileName,
      authStackInputPayload: {
        breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
        ...this._authInputState.getCliInputPayload(),
      },
      event: CommandType.ADD,
    };
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
}
