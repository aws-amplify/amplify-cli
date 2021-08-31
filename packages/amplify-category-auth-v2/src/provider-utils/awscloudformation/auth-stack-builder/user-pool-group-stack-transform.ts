import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  buildOverrideDir,
  CFNTemplateFormat,
  CLISubCommands,
  JSONUtilities,
  pathManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import * as path from 'path';
import { AmplifyUserPoolGroupStack } from './auth-user-pool-group-stack-builder';
import * as fs from 'fs-extra';
import * as vm from 'vm';
import * as amplifyPrinter from 'amplify-prompts';
import { AmplifyUserPoolGroupStackTemplate } from './types';
import { Template, AmplifyStackTemplate, AmplifyCategoryTransform } from 'amplify-cli-core';
import { CognitoCLIInputs } from '../service-walkthrough-types/cognito-user-input-types';

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

export class AmplifyUserPoolGroupTransform extends AmplifyCategoryTransform {
  _app: cdk.App;
  _userPoolGroupTemplateObj: AmplifyUserPoolGroupStack; // Props to modify Root stack data
  _userPoolGroupStackOptions: AmplifyUserPoolGroupStackOptions; // options to help generate  cfn template
  _synthesizer: AuthStackSythesizer;
  _category: string;
  _service: string;
  _resourceName: string;
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
    const userPoolGroupStackProps = await this.generateStackProps(context);

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateStackResources(userPoolGroupStackProps);

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

  private generateStackResources = async (props: AmplifyUserPoolGroupStackOptions) => {
    this._userPoolGroupTemplateObj = new AmplifyUserPoolGroupStack(this._app, 'AmplifyUserPoolGroupStack', {
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

    const cognitoStackTemplateObj = this._userPoolGroupTemplateObj as AmplifyUserPoolGroupStackTemplate & AmplifyStackTemplate;
    //TODO: Check Script Options
    if (typeof overrideProps === 'function' && overrideProps) {
      try {
        this._userPoolGroupTemplateObj = overrideProps(cognitoStackTemplateObj);

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
  private generateStackProps = async (context: $TSContext): Promise<AmplifyUserPoolGroupStackOptions> => {
    const resourceDirPath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
    const groups = JSONUtilities.readJson(resourceDirPath, { throwIfNotExist: true })!;

    const identityPoolName = this._cliInputs.identityPoolName;
    return {
      groups: groups as UserPoolGroupMetadata[],
      identityPoolName,
      cognitoResourceName: this._resourceName,
    };
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  public synthesizeTemplates = async (): Promise<Template> => {
    this._app.synth();
    const templates = this._synthesizer.collectStacks();
    return templates.get('AmplifyUserPoolGroupStack')!;
  };

  public saveBuildFiles = async (template: Template) => {
    const cognitoStackFileName = 'template.json';
    const cognitostackFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this._resourceName,
      'build',
      cognitoStackFileName,
    );
    writeCFNTemplate(template, cognitostackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
  };
}
