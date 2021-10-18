import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  buildOverrideDir,
  CFNTemplateFormat,
  JSONUtilities,
  pathManager,
  writeCFNTemplate,
  Template,
  AmplifyStackTemplate,
  AmplifyCategoryTransform,
  $TSAny,
} from 'amplify-cli-core';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import * as path from 'path';
import { AmplifyUserPoolGroupStack, AmplifyUserPoolGroupStackOutputs } from './auth-user-pool-group-stack-builder';
import { printer, formatter } from 'amplify-prompts';
import _ from 'lodash';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import * as fs from 'fs-extra';
import * as vm from 'vm2';
import os from 'os';

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
  private _app: cdk.App;
  private _userPoolGroupTemplateObj: AmplifyUserPoolGroupStack; // Props to modify Root stack data
  private _synthesizer: AuthStackSythesizer;
  private _synthesizerOutputs: AuthStackSythesizer;
  private __userPoolGroupTemplateObjOutputs: AmplifyUserPoolGroupStackOutputs;
  private _authResourceName: string;
  private _category: string;
  private _service: string;
  private _cliInputs: CognitoCLIInputs;
  private _resourceName: string;

  constructor(resourceName: string) {
    super(resourceName);
    this._authResourceName = resourceName;
    this._resourceName = 'UserPoolGroups';
    this._synthesizer = new AuthStackSythesizer();
    this._synthesizerOutputs = new AuthStackSythesizer();
    this._app = new cdk.App();
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITOUSERPOOLGROUPS;
  }

  public async transform(context: $TSContext): Promise<Template> {
    // parse Input data
    const userPoolGroupStackOptions = await this.generateStackProps(context);

    // generate cfn Constructs and AmplifyRootStackTemplate object to get overridden
    await this.generateStackResources(userPoolGroupStackOptions);

    // apply override on Amplify Object having CDK Constructs for Root Stack
    await this.applyOverride();

    // generate CFN template
    const template: Template = await this.synthesizeTemplates();

    // save stack
    await this.saveBuildFiles(context, template);
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

    this.__userPoolGroupTemplateObjOutputs = new AmplifyUserPoolGroupStackOutputs(this._app, 'AmplifyUserPoolGroupStackOutputs', {
      synthesizer: this._synthesizerOutputs,
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
      'AuthRoleArn',
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'UnauthRoleArn',
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${props.cognitoResourceName}UserPoolId`,
    );

    if (props.identityPoolName) {
      this._userPoolGroupTemplateObj.addCfnParameter(
        {
          type: 'String',
        },
        `auth${props.cognitoResourceName}IdentityPoolId`,
      );
    }

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${props.cognitoResourceName}AppClientID`,
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      `auth${props.cognitoResourceName}AppClientIDWeb`,
    );

    // add CFN condition
    this._userPoolGroupTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(this._userPoolGroupTemplateObj.getCfnParameter('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );

    // generate resources
    this._userPoolGroupTemplateObj.generateUserPoolGroupResources(props);

    // generate CFN outputs again to generate same Output Names as cdk doesnt allow resource with same logical names
    if (props.identityPoolName) {
      props.groups.forEach(group => {
        this.__userPoolGroupTemplateObjOutputs.addCfnOutput(
          {
            value: cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString(),
          },
          `${group.groupName}GroupRole`,
        );
      });
    }
  };

  public applyOverride = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = path.join(backendDir, this._category, this._resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir).catch(error => {
      printer.warn(`Skipping build as ${error.message}`);
      return false;
    });
    if (isBuild) {
      const overrideCode: string = await fs.readFile(path.join(overrideDir, 'build', 'override.js'), 'utf-8').catch(() => {
        formatter.list(['No override File Found', `To override ${this._resourceName} run amplify override auth`]);
        return '';
      });
      const cognitoStackTemplateObj = this._userPoolGroupTemplateObj as AmplifyUserPoolGroupStack & AmplifyStackTemplate;
      const sandboxNode = new vm.NodeVM({
        console: 'inherit',
        timeout: 5000,
        sandbox: {},
      });
      try {
        this._userPoolGroupTemplateObj = sandboxNode.run(overrideCode).overrideProps(cognitoStackTemplateObj);
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
  private generateStackProps = async (context: $TSContext): Promise<AmplifyUserPoolGroupStackOptions> => {
    const resourceDirPath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
    const groups = JSONUtilities.readJson(resourceDirPath, { throwIfNotExist: true });
    const cliState = new AuthInputState(this._authResourceName);
    this._cliInputs = cliState.getCLIInputPayload();
    const identityPoolName = this._cliInputs.cognitoConfig.identityPoolName;
    return {
      groups: groups as UserPoolGroupMetadata[],
      identityPoolName,
      cognitoResourceName: this._authResourceName,
    };
  };

  /**
   *
   * @returns return CFN templates sunthesized by app
   */
  public synthesizeTemplates = async (): Promise<Template> => {
    this._app.synth();
    const templates = this._synthesizer.collectStacks();
    const cfnTemplate = templates.get('AmplifyUserPoolGroupStack')!;
    const cfnTemplateOutputs = templates.get('AmplifyUserPoolGroupStackOutputs')!;
    Object.assign(cfnTemplate, cfnTemplateOutputs);
    return cfnTemplate;
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
    writeCFNTemplate(template, cognitostackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
  };
}
