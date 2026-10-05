import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyCategoryTransform,
  AmplifyError,
  AmplifySupportedService,
  buildOverrideDir,
  CFNTemplateFormat,
  FeatureFlags,
  JSONUtilities,
  pathManager,
  runOverride,
  stateManager,
  Template,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { AuthTriggerConnection, AuthTriggerPermissions, CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import { configureSmsOption } from '../utils/configure-sms';
import { generateNestedAuthTriggerTemplate } from '../utils/generate-auth-trigger-template';
import { createUserPoolGroups, updateUserPoolGroups } from '../utils/synthesize-resources';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AuthStackSynthesizer } from './stack-synthesizer';
import { getProjectInfo } from '@aws-amplify/cli-extensibility-helper';

/**
 *  Class to handle Auth cdk generation / override functionality
 */
export class AmplifyAuthTransform extends AmplifyCategoryTransform {
  private _app: cdk.App;
  private _category: string;
  private _service: string;
  private _authTemplateObj: AmplifyAuthCognitoStack; // Props to modify Root stack data
  private _synthesizer: AuthStackSynthesizer;
  private _cliInputs: CognitoCLIInputs;
  private _cognitoStackProps: CognitoStackOptions;

  constructor(resourceName: string) {
    super(resourceName);
    this._synthesizer = new AuthStackSynthesizer();
    this._app = new cdk.App();
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITO;
    // eslint-disable-next-line spellcheck/spell-checker
    this._authTemplateObj = new AmplifyAuthCognitoStack(this._app, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
  }

  /**
   * Entry point to generate CFN template w/o overrides
   */
  public async transform(context: $TSContext): Promise<Template> {
    // parse Input data
    // validating cli-inputs
    const cliState = new AuthInputState(context, this.resourceName);
    this._cliInputs = cliState.getCLIInputPayload();
    this._cognitoStackProps = await this.generateStackProps(context);

    const resources = stateManager.getMeta();
    if (resources.auth?.userPoolGroups) {
      await updateUserPoolGroups(context, this._cognitoStackProps.resourceName!, this._cognitoStackProps.userPoolGroupList);
    } else {
      await createUserPoolGroups(context, this._cognitoStackProps.resourceName!, this._cognitoStackProps.userPoolGroupList);
    }
    // generate custom Auth Trigger for Cognito
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
   * Generates CFN Resources for Auth
   */
  private async generateStackResources(props: CognitoStackOptions): Promise<void> {
    // add CFN parameter
    this.addCfnParameters(props);

    // add CFN condition
    this.addCfnConditions();
    // generate Resources

    await this._authTemplateObj.generateCognitoStackResources(props);

    // generate Output
    this.generateCfnOutputs(props);
  }

  public applyOverride = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = path.join(backendDir, this._category, this.resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir);
    if (isBuild) {
      const projectInfo = getProjectInfo();
      try {
        await runOverride(overrideDir, this._authTemplateObj, projectInfo);
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
   * Generate Object required by cdk to generate Auth cfn template
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

    let cognitoStackProps: CognitoStackOptions = {
      ...this._cliInputs.cognitoConfig,
      ...roles,
      breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
      // eslint-disable-next-line spellcheck/spell-checker
      useEnabledMfas: FeatureFlags.getBoolean('auth.useenabledmfas'),
      dependsOn: [],
    };

    // get env secrets
    const teamProviderObj = context.amplify.loadEnvResourceParameters(context, this._category, this.resourceName);
    if (!_.isEmpty(teamProviderObj)) {
      cognitoStackProps = Object.assign(cognitoStackProps, teamProviderObj);
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
      const dependsOnKeys = Object.keys(this._cliInputs.cognitoConfig.triggers ?? {}).map(
        (i) => `${this._cliInputs.cognitoConfig.resourceName}${i}`,
      );
      const dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
      // generate trigger config
      const keys = Object.keys(this._cliInputs.cognitoConfig.triggers as string);
      // Auth lambda config for Triggers
      const authTriggerConnections: AuthTriggerConnection[] = [];
      keys.forEach((key) => {
        const config: AuthTriggerConnection = {
          triggerType: key === 'PreSignup' ? 'PreSignUp' : key,
          lambdaFunctionName: `${this.resourceName}${key}`,
        };
        authTriggerConnections.push(config);
      });
      cognitoStackProps = Object.assign(cognitoStackProps, { permissions: triggerPermissions, dependsOn, authTriggerConnections });
    }
    return cognitoStackProps;
  };

  /**
   * return CFN templates synthesized by cdk app
   */
  private synthesizeTemplates = async (): Promise<Template> => {
    this._app.synth();
    const templates = this._synthesizer.collectStacks();
    // eslint-disable-next-line spellcheck/spell-checker
    return templates.get('AmplifyAuthCongitoStack')!;
  };

  public saveBuildFiles = async (context: $TSContext, template: Template): Promise<void> => {
    const cognitoStackFileName = `${this.resourceName}-cloudformation-template.json`;
    const cognitoStackFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this.resourceName,
      'build',
      cognitoStackFileName,
    );
    // write CFN template
    await writeCFNTemplate(template, cognitoStackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
    // write parameters.json
    await this.writeBuildFiles(context);
  };

  private writeBuildFiles = async (context: $TSContext): Promise<void> => {
    const parametersJSONFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this.resourceName,
      'build',
      'parameters.json',
    );

    const oldParameters = fs.readJSONSync(parametersJSONFilePath, { throws: false });

    const roles = {
      authRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      unauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };

    // save parameters
    let parameters: CognitoStackOptions = {
      ...this._cliInputs.cognitoConfig,
      ...roles,
      breakCircularDependency: this._cognitoStackProps.breakCircularDependency,
      useEnabledMfas: this._cognitoStackProps.useEnabledMfas,
      dependsOn: [], // to support undefined meta in update,
    };

    // convert triggers to JSON
    if (this._cognitoStackProps.triggers && !_.isEmpty(this._cognitoStackProps.triggers)) {
      this._cognitoStackProps.triggers = JSON.stringify(this._cognitoStackProps.triggers);
      // convert permissions
      const triggerPermissions = this._cognitoStackProps.permissions!.map((i) => JSON.stringify(i));
      // convert dependsOn
      const { dependsOn } = this._cognitoStackProps;
      // convert auth trigger connections
      const authTriggerConnections = this._cognitoStackProps.authTriggerConnections!.map((obj) => {
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

    this.validateCfnParameters(context, oldParameters, parameters);

    // save parameters
    JSONUtilities.writeJson(parametersJSONFilePath, parameters);
  };

  /**
   * validate cfn Parameters for the bug mentioned below
   */
  public validateCfnParameters(context: $TSContext, oldParameters: $TSAny, parametersJson: $TSAny): boolean {
    // There was a bug between v7.3.0 and v7.6.9 where Cognito resources were being created with incorrect `requiredAttributes` parameter
    // Since `requiredAttributes` is immutable, we must adjust this or CloudFormation step will fail
    // More info: https://github.com/aws-amplify/amplify-cli/issues/9525
    if (!oldParameters?.requiredAttributes?.length) {
      return true;
    }

    const cliInputsFilePath = path.join(pathManager.getBackendDirPath(), this._category, this.resourceName, 'cli-inputs.json');
    const containsAll = (arr1: string[], arr2: string[]): boolean => arr2.every((arr2Item) => arr1.includes(arr2Item));
    const sameMembers = (arr1: string[], arr2: string[]): boolean => arr1.length === arr2.length && containsAll(arr2, arr1);
    if (!sameMembers(oldParameters.requiredAttributes ?? [], parametersJson.requiredAttributes ?? [])) {
      context.print.error(
        `Cognito configuration in the cloud has drifted from local configuration. Present changes cannot be pushed until drift is fixed. \`requiredAttributes\` requested is ${JSON.stringify(
          parametersJson.requiredAttributes,
        )}, but ${JSON.stringify(
          oldParameters.requiredAttributes,
        )} is required by Cognito configuration. Update ${cliInputsFilePath} to continue.`,
      );
      process.exit(1);
    }
    return true;
  }

  /**
   * generate cfn outputs
   */
  private generateCfnOutputs = (props: CognitoStackOptions): void => {
    const configureSMS = configureSmsOption(props);

    if (props.authSelections === 'identityPoolAndUserPool' || props.authSelections === 'identityPoolOnly') {
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

  /**
   *  adds cfn parameters
   */
  private addCfnParameters = (props: CognitoStackOptions): void => {
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );

    if (!_.isEmpty(props.dependsOn)) {
      const { dependsOn } = props;
      dependsOn?.forEach((param) => {
        param.attributes.forEach((attribute: $TSAny) => {
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
      if (key === 'hostedUIProviderCreds') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
            noEcho: true,
          },
          key,
        );
        continue;
      }
      if (typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value))) {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          key,
        );
      }

      if (typeof value === 'boolean') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          key,
        );
      }
      if (typeof value === 'number') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          key,
        );
      }
      if (value === 'parentStack') {
        this._authTemplateObj.addCfnParameter(
          {
            type: 'String',
          },
          key,
        );
      }
      if (Array.isArray(value)) {
        if (key !== 'userAutoVerifiedAttributeUpdateSettings') {
          this._authTemplateObj.addCfnParameter(
            {
              type: 'CommaDelimitedList',
            },
            key,
          );
        }
      }
    }

    if (Object.keys(props).includes('hostedUIProviderMeta') && !Object.keys(props).includes('hostedUIProviderCreds')) {
      this._authTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: '[]',
        },
        'hostedUIProviderCreds',
      );
    }
  };

  /**
   *  adds cfn conditions
   */
  private addCfnConditions = (): void => {
    this._authTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );
  };
}
