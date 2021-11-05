import {
  AmplifyCategories,
  AmplifySupportedService,
  pathManager,
  FeatureFlags,
  $TSContext,
  writeCFNTemplate,
  CFNTemplateFormat,
  buildOverrideDir,
  Template,
  AmplifyStackTemplate,
  AmplifyCategoryTransform,
  JSONUtilities,
  stateManager,
  $TSAny,
} from 'amplify-cli-core';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { CognitoStackOptions, AuthTriggerConnection, AuthTriggerPermissions } from '../service-walkthrough-types/cognito-user-input-types';
import _ from 'lodash';
import * as path from 'path';
import { printer, formatter } from 'amplify-prompts';
import { generateNestedAuthTriggerTemplate } from '../utils/generate-auth-trigger-template';
import { createUserPoolGroups, updateUserPoolGroups } from '../utils/synthesize-resources';
import { AttributeType, CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import * as vm from 'vm2';
import * as fs from 'fs-extra';
import os from 'os';

export class AmplifyAuthTransform extends AmplifyCategoryTransform {
  private _app: cdk.App;
  private _category: string;
  private _service: string;
  private _authTemplateObj: AmplifyAuthCognitoStack; // Props to modify Root stack data
  private _synthesizer: AuthStackSythesizer;
  private _cliInputs: CognitoCLIInputs;
  private _cognitoStackProps: CognitoStackOptions;

  constructor(resourceName: string) {
    super(resourceName);
    this._synthesizer = new AuthStackSythesizer();
    this._app = new cdk.App();
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITO;
    this._authTemplateObj = new AmplifyAuthCognitoStack(this._app, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
  }

  public async transform(context: $TSContext): Promise<Template> {
    // parse Input data
    // validating cli-inputs
    const cliState = new AuthInputState(this.resourceName);
    this._cliInputs = cliState.getCLIInputPayload();
    this._cognitoStackProps = await this.generateStackProps(context);

    const resources = stateManager.getMeta();
    if (resources.auth?.userPoolGroups) {
      await updateUserPoolGroups(context, this._cognitoStackProps.resourceName!, this._cognitoStackProps.userPoolGroupList);
    } else {
      await createUserPoolGroups(context, this._cognitoStackProps.resourceName!, this._cognitoStackProps.userPoolGroupList);
    }
    // generate customm Auth Trigger for Cognito
    if (this._cognitoStackProps.breakCircularDependency) {
      await generateNestedAuthTriggerTemplate(this._category, this.resourceName, this._cognitoStackProps);
    }
    // this will also include lambda triggers and adminQueries once api and function transform are done

    await this.generateStackResources(this._cognitoStackProps);

    // apply override on Amplify Object having CDK Constructs for Auth Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // save stack and parameters.json
    await this.saveBuildFiles(context, template);
    return template;
  }

  /**
   * Generates CFN REsources for Auth
   * @returns CFN Template
   */

  private async generateStackResources(props: CognitoStackOptions) {
    // add CFN parameter
    this.addCfnParameters(props);

    // add CFN condition
    this.addCfnConditions(props);
    // generate Resources

    this._authTemplateObj.generateCognitoStackResources(props);

    //generate Output
    this.generateCfnOutputs(props);
  }

  public applyOverride = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = path.join(backendDir, this._category, this.resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir).catch(error => {
      printer.debug(`Skipping build as ${error.message}`);
      return false;
    });
    if (isBuild) {
      const overrideCode: string = await fs.readFile(path.join(overrideDir, 'build', 'override.js'), 'utf-8').catch(() => {
        formatter.list(['No override File Found', `To override ${this.resourceName} run amplify override auth`]);
        return '';
      });

      const sandboxNode = new vm.NodeVM({
        console: 'inherit',
        timeout: 5000,
        sandbox: {},
        require: {
          context: 'sandbox',
          builtin: ['path'],
          external: true,
        },
      });
      try {
        await sandboxNode
          .run(overrideCode, path.join(overrideDir, 'build', 'override.js'))
          .override(this._authTemplateObj as AmplifyAuthCognitoStack & AmplifyStackTemplate);
      } catch (err: $TSAny) {
        const error = new Error(`Skipping override due to ${err}${os.EOL}`);
        printer.error(`${error}`);
        error.stack = undefined;
        throw error;
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private generateStackProps = async (context: $TSContext): Promise<CognitoStackOptions> => {
    // roles to append to cognito stacks
    const roles = {
      authRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      unauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };

    let cognitoStackProps = {
      ...this._cliInputs.cognitoConfig,
      ...roles,
      breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
      dependsOn: [],
    };

    // get env secrets
    const teamProviderobj = context.amplify.loadEnvResourceParameters(context, this._category, this.resourceName);
    if (!_.isEmpty(teamProviderobj)) {
      cognitoStackProps = Object.assign(cognitoStackProps, teamProviderobj);
    }
    // determine permissions needed for each trigger module
    if (!_.isEmpty(this._cliInputs.cognitoConfig.triggers)) {
      const permissions = await context.amplify.getTriggerPermissions(
        context,
        this._cliInputs.cognitoConfig.triggers,
        AmplifyCategories.AUTH,
        this._cliInputs.cognitoConfig.resourceName,
      );

      const triggerPermissions: AuthTriggerPermissions[] = permissions?.map((i: string) => JSON.parse(i));

      // handle dependsOn data
      const dependsOnKeys = Object.keys(this._cliInputs.cognitoConfig.triggers).map(
        i => `${this._cliInputs.cognitoConfig.resourceName}${i}`,
      );
      const dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
      // generate trigger config
      const keys = Object.keys(this._cliInputs.cognitoConfig.triggers);
      // Auth lambda config for Triggers
      const authTriggerConnections: AuthTriggerConnection[] = [];
      keys.forEach(key => {
        let config: AuthTriggerConnection = {
          triggerType: key === 'PreSignup' ? 'PreSignUp' : key,
          lambdaFunctionName: key === 'PreSignup' ? 'PreSignUp' : `${this.resourceName}${key}`,
        };
        authTriggerConnections.push(config);
      });
      cognitoStackProps = Object.assign(cognitoStackProps, { permissions: triggerPermissions, dependsOn, authTriggerConnections });
    }
    return cognitoStackProps;
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this._app.synth();
    const templates = this._synthesizer.collectStacks();
    return templates.get('AmplifyAuthCongitoStack')!;
  };

  public saveBuildFiles = async (context: $TSContext, template: Template): Promise<void> => {
    const cognitoStackFileName = `${this.resourceName}-cloudformation-template.json`;
    const cognitostackFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this.resourceName,
      'build',
      cognitoStackFileName,
    );
    // write CFN template
    writeCFNTemplate(template, cognitostackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
    // write parameters.json
    this.writeBuildFiles(context);
  };

  private writeBuildFiles = async (context: $TSContext) => {
    const parametersJSONFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this.resourceName,
      'build',
      'parameters.json',
    );

    const roles = {
      authRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      unauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };

    //save parameters
    let parameters = {
      ...this._cliInputs.cognitoConfig,
      ...roles,
      breakCircularDependency: this._cognitoStackProps.breakCircularDependency,
      dependsOn: [], // to support undefined meta in update,
    };

    // convert triggers to JSON
    if (this._cognitoStackProps.triggers && !_.isEmpty(this._cognitoStackProps.triggers)) {
      this._cognitoStackProps.triggers = JSON.stringify(this._cognitoStackProps.triggers);
      // convert permissions
      const triggerPermissions = this._cognitoStackProps.permissions!.map(i => JSON.stringify(i));
      // convert dependsOn
      const dependsOn = this._cognitoStackProps.dependsOn;
      // convert auth trigger connections
      const authTriggerConnections = this._cognitoStackProps.authTriggerConnections!.map(obj => {
        const modifiedObj = _.omit(obj, ['lambdaFunctionArn']);
        return JSON.stringify(modifiedObj);
      });
      parameters = Object.assign(parameters, {
        permissions: triggerPermissions,
        triggers: this._cognitoStackProps.triggers,
        dependsOn,
        authTriggerConnections,
      });
    } else if (_.isEmpty(this._cognitoStackProps.triggers)) {
      parameters = Object.assign(parameters, { triggers: JSON.stringify(this._cognitoStackProps.triggers) });
    }
    //save parameters
    JSONUtilities.writeJson(parametersJSONFilePath, parameters);
  };

  private generateCfnOutputs = (props: CognitoStackOptions) => {
    const configureSMS =
      (props.autoVerifiedAttributes && props.autoVerifiedAttributes.includes('phone_number')) ||
      (props.mfaConfiguration != 'OFF' && props.mfaTypes && props.mfaTypes.includes('SMS Text Message')) ||
      (props.requiredAttributes && props.requiredAttributes.includes('phone_number')) ||
      (props.usernameAttributes && props.usernameAttributes.includes(AttributeType.PHONE_NUMBER));

    if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections == 'identityPoolOnly') {
      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('IdentityPool'),
          description: 'Id for the identity pool',
        },
        'IdentityPoolId',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.getAtt('IdentityPool', 'Name').toString(),
        },
        'IdentityPoolName',
      );
    }

    if (props.hostedUIDomainName) {
      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.conditionIf(
            'ShouldNotCreateEnvResources',
            cdk.Fn.ref('hostedUIDomainName'),
            cdk.Fn.join('-', [cdk.Fn.ref('hostedUIDomainName'), cdk.Fn.ref('env')]),
          ).toString(),
        },
        'HostedUIDomain',
      );
    }

    if (props.oAuthMetadata) {
      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('oAuthMetadata'),
        },
        'OAuthMetadata',
      );
    }

    if (props.authSelections !== 'identityPoolOnly') {
      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('UserPool'),
          description: 'Id for the user pool',
        },
        'UserPoolId',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.getAtt('UserPool', 'Arn').toString(),
          description: 'Arn for the user pool',
        },
        'UserPoolArn',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('userPoolName'),
        },
        'UserPoolName',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('UserPoolClientWeb'),
          description: 'The user pool app client id for web',
        },
        'AppClientIDWeb',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.ref('UserPoolClient'),
          description: 'The user pool app client id',
        },
        'AppClientID',
      );

      this._authTemplateObj.addCfnOutput(
        {
          value: cdk.Fn.getAtt('UserPoolClientInputs', 'appSecret').toString(),
          condition: this._authTemplateObj.getCfnCondition('ShouldOutputAppClientSecrets'),
        },
        'AppClientSecret',
      );

      if (!props.useEnabledMfas || configureSMS) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.getAtt('SNSRole', 'Arn').toString(),
            description: 'role arn',
          },
          'CreatedSNSRole',
        );
      }

      if (props.googleClientId) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('googleClientId'),
          },
          'GoogleWebClient',
        );
      }

      if (props.googleIos) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('googleIos'),
          },
          'GoogleIOSClient',
        );
      }

      if (props.googleAndroid) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('googleAndroid'),
          },
          'GoogleAndroidClient',
        );
      }

      if (props.facebookAppId) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('facebookAppId'),
          },
          'FacebookWebClient',
        );
      }

      if (props.amazonAppId) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('amazonAppId'),
          },
          'AmazonWebClient',
        );
      }

      if (props.appleAppId) {
        this._authTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.ref('appleAppId'),
          },
          'AppleWebClient',
        );
      }
    }
  };

  private addCfnParameters = (props: CognitoStackOptions) => {
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );

    if (!_.isEmpty(props.dependsOn)) {
      const dependsOn = props.dependsOn;
      dependsOn?.forEach(param => {
        param.attributes.forEach(attribute => {
          this._authTemplateObj.addCfnParameter(
            {
              type: 'String',
              default: `${param.category}${param.resourceName}${attribute}`,
            },
            `${param.category}${param.resourceName}${attribute}`,
          );
        });
      });
    }

    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value))) {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${key}`,
        );
      }

      if (typeof value === 'boolean') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${key}`,
        );
      }
      if (typeof value === 'number') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${key}`,
        );
      }
      if (value === 'parentStack') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          `${key}`,
        );
      }
      if (Array.isArray(value)) {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'CommaDelimitedList',
          },
          `${key}`,
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
  };

  private addCfnConditions = (props: CognitoStackOptions) => {
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
  };
}
