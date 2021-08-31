import {
  AmplifyCategories,
  AmplifySupportedService,
  pathManager,
  FeatureFlags,
  $TSContext,
  writeCFNTemplate,
  CFNTemplateFormat,
  buildOverrideDir,
} from 'amplify-cli-core';
import { AmplifyAuthCognitoStack } from './auth-cognito-stack-builder';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { CognitoStackOptions, CognitoCLIInputs } from '../service-walkthrough-types/cognito-user-input-types';
import { AmplifyAuthCognitoStackTemplate } from './types';
import _ from 'lodash';
import { Template, AmplifyStackTemplate, AmplifyCategoryTransform } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as vm from 'vm';
import * as amplifyPrinter from 'amplify-prompts';

export class AmplifyAuthTransform extends AmplifyCategoryTransform {
  _app: cdk.App;
  _category: string;
  _service: string;
  _resourceName: string;
  _authTemplateObj: AmplifyAuthCognitoStack; // Props to modify Root stack data
  _synthesizer: AuthStackSythesizer;
  _cliInputs: CognitoCLIInputs;

  constructor(resourceName: string) {
    super(resourceName);
    this._resourceName = resourceName;
    this._synthesizer = new AuthStackSythesizer();
    this._app = new cdk.App();
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITO;
    try {
      // validating cli-inputs
      const cliState = new AuthInputState(resourceName);
      this._cliInputs = cliState.getCliInputPayload();
      cliState.isCLIInputsValid(this._cliInputs);
    } catch (error) {
      throw new Error(error);
    }
  }

  public async transform(context: $TSContext): Promise<Template> {
    // parse Input data
    const cognitoStackProps = await this.generateStackProps(context);
    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateStackResources(cognitoStackProps);

    // apply override on Amplify Object having CDK Constructs for Root Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // save stack
    await this.saveBuildFiles(template);
    return template;
  }

  /**
   * Generates CFN REsources for Auth
   * @returns CFN Template
   */

  private async generateStackResources(props: CognitoStackOptions) {
    this._authTemplateObj = new AmplifyAuthCognitoStack(this._app, 'AmplifyAuthCongitoStack', { synthesizer: this._synthesizer });
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
          value: cdk.Fn.getAtt('IdenityId', 'Arn').toString(),
          description: 'Id for the identity pool',
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

      if (props.mfaConfiguration != 'OFF') {
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
  }

  public applyOverride = async () => {
    const projectRoot = pathManager.findProjectRoot();
    const overrideDir = pathManager.getOverrideDirPath(projectRoot!, this._category, this._resourceName);
    await buildOverrideDir(overrideDir).catch(error => {
      amplifyPrinter.printer.warn(`Skipping build as ${error.message}`);
      return null;
    });
    const { overrideProps } = await import(path.join(overrideDir, 'build', 'override.js')).catch(error => {
      amplifyPrinter.formatter.list([
        'No override File Found',
        `To override ${this._resourceName} run amplify override auth ${this._resourceName} `,
      ]);
      return undefined;
    });
    // const overrideCode : string = await fs.readFile(path.join(overrideDir,'build','override.js'),'utf-8').catch( ()  =>{
    //   amplifyPrinter.formatter.list(['No override File Found',`To override ${this._resourceName} run amplify override auth ${this._resourceName} `]);
    //   return '';
    // });
    const cognitoStackTemplateObj = this._authTemplateObj as AmplifyAuthCognitoStackTemplate & AmplifyStackTemplate;
    //TODO: Check Script Options
    if (typeof overrideProps === 'function' && overrideProps) {
      try {
        this._authTemplateObj = overrideProps(cognitoStackTemplateObj);

        //The vm module enables compiling and running code within V8 Virtual Machine contexts. The vm module is not a security mechanism. Do not use it to run untrusted code.
        // const script = new vm.Script(overrideCode);
        // script.runInContext(vm.createContext(cognitoStackTemplateObj));
        return;
      } catch (error) {
        throw new Error(error);
      }
    }
  };
  /**
   *
   * @returns Object required to generate Stack using cdk
   */
  private generateStackProps = async (context: $TSContext): Promise<CognitoStackOptions> => {
    // determine permissions needed for each trigger module
    if (!_.isEmpty(this._cliInputs.triggers)) {
      const permissions = await context.amplify.getTriggerPermissions(
        context,
        this._cliInputs.triggers,
        AmplifyCategories.AUTH,
        this._cliInputs.resourceName!,
      );
      const triggerPermissions = permissions.map((i: string) => JSON.parse(i));

      // handle dependsOn data
      const dependsOnKeys = Object.keys(this._cliInputs.triggers).map(i => `${this._cliInputs.resourceName}${i}`);
      const dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
      return {
        breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
        permissions: triggerPermissions,
        dependsOn,
        ...this._cliInputs,
      };
    }
    return {
      breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
      ...this._cliInputs,
    };
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

  public saveBuildFiles = async (template: Template): Promise<void> => {
    const cognitoStackFileName = `${this._resourceName}-cloudformation-template.yml`;
    const cognitostackFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this._resourceName,
      'build',
      cognitoStackFileName,
    );
    writeCFNTemplate(template, cognitostackFilePath, {
      templateFormat: CFNTemplateFormat.YAML,
    });
  };
}
