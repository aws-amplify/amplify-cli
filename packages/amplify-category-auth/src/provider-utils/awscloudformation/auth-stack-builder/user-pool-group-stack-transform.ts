import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyCategoryTransform,
  AmplifyError,
  AmplifySupportedService,
  buildOverrideDir,
  CFNTemplateFormat,
  JSONUtilities,
  pathManager,
  runOverride,
  Template,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { AmplifyUserPoolGroupStack, AmplifyUserPoolGroupStackOutputs } from './index';
import { AuthStackSynthesizer } from './stack-synthesizer';
import { getProjectInfo } from '@aws-amplify/cli-extensibility-helper';

/**
 * UserPool groups metadata
 */
export type UserPoolGroupMetadata = {
  groupName: string;
  precedence: number;
  customPolicies?: $TSAny;
};

/**
 * UserPoolGroupStackOptions
 */
export type AmplifyUserPoolGroupStackOptions = {
  groups: UserPoolGroupMetadata[];
  identityPoolName?: string;
  cognitoResourceName: string;
};

/**
 *  Class Amplify UserPoolGroups
 */
export class AmplifyUserPoolGroupTransform extends AmplifyCategoryTransform {
  private _app: cdk.App;
  private _userPoolGroupTemplateObj: AmplifyUserPoolGroupStack; // Props to modify Root stack data
  private _synthesizer: AuthStackSynthesizer;
  private _synthesizerOutputs: AuthStackSynthesizer;
  private __userPoolGroupTemplateObjOutputs: AmplifyUserPoolGroupStackOutputs;
  private _authResourceName: string;
  private _category: string;
  private _service: string;
  private _cliInputs: CognitoCLIInputs;
  private _resourceName: string;

  constructor(resourceName: string) {
    super(resourceName);
    this._authResourceName = resourceName;
    this._resourceName = 'userPoolGroups';
    this._synthesizer = new AuthStackSynthesizer();
    this._synthesizerOutputs = new AuthStackSynthesizer();
    this._app = new cdk.App();
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITOUSERPOOLGROUPS;
  }

  /**
   * Entry point to UserPoolGroup cfn generation
   */
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
   * Generates CFN Resources for Auth
   */
  private generateStackResources = async (props: AmplifyUserPoolGroupStackOptions): Promise<void> => {
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
        default: `auth${props.cognitoResourceName}UserPoolId`,
      },
      `auth${props.cognitoResourceName}UserPoolId`,
    );

    if (props.identityPoolName) {
      this._userPoolGroupTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: `auth${props.cognitoResourceName}IdentityPoolId`,
        },
        `auth${props.cognitoResourceName}IdentityPoolId`,
      );
    }

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
        default: `auth${props.cognitoResourceName}AppClientID`,
      },
      `auth${props.cognitoResourceName}AppClientID`,
    );

    this._userPoolGroupTemplateObj.addCfnParameter(
      {
        type: 'String',
        default: `auth${props.cognitoResourceName}AppClientIDWeb`,
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
    await this._userPoolGroupTemplateObj.generateUserPoolGroupResources(props);

    // generate CFN outputs again to generate same Output Names as cdk doesn't allow resource with same logical names
    if (props.identityPoolName) {
      props.groups.forEach((group) => {
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
    const isBuild = await buildOverrideDir(backendDir, overrideDir);
    if (isBuild) {
      const projectInfo = getProjectInfo();
      try {
        await runOverride(overrideDir, this._userPoolGroupTemplateObj, projectInfo);
      } catch (err: $TSAny) {
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
   * Object required to generate Stack using cdk
   */
  private generateStackProps = async (context: $TSContext): Promise<AmplifyUserPoolGroupStackOptions> => {
    const resourceDirPath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');
    const groups = JSONUtilities.readJson(resourceDirPath, { throwIfNotExist: true });
    const cliState = new AuthInputState(context, this._authResourceName);
    this._cliInputs = cliState.getCLIInputPayload();
    const { identityPoolName } = this._cliInputs.cognitoConfig;
    return {
      groups: groups as UserPoolGroupMetadata[],
      identityPoolName,
      cognitoResourceName: this._authResourceName,
    };
  };

  /**
   * return CFN templates synthesized by app
   */
  public synthesizeTemplates = async (): Promise<Template> => {
    this._app.synth();
    const templates = this._synthesizer.collectStacks();
    const cfnUserPoolGroupStack: Template = templates.get('AmplifyUserPoolGroupStack')!;
    const templatesOutput = this._synthesizerOutputs.collectStacks();
    const cfnUserPoolGroupOutputs: Template = templatesOutput.get('AmplifyUserPoolGroupStackOutputs')!;
    cfnUserPoolGroupStack.Outputs = cfnUserPoolGroupOutputs.Outputs;
    return cfnUserPoolGroupStack;
  };

  public saveBuildFiles = async (__context: $TSContext, template: Template): Promise<void> => {
    const cognitoStackFileName = `${this._resourceName}-cloudformation-template.json`;
    const cognitoStackFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this._resourceName,
      'build',
      cognitoStackFileName,
    );
    await writeCFNTemplate(template, cognitoStackFilePath, {
      templateFormat: CFNTemplateFormat.JSON,
    });
    // write parameters.json file
    this.writeBuildFiles();
  };

  private writeBuildFiles = (): void => {
    const parametersJSONFilePath = path.join(
      pathManager.getBackendDirPath(),
      this._category,
      this._resourceName,
      'build',
      'parameters.json',
    );

    const roles = {
      AuthRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      UnauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };

    // save parameters
    const parameters = {
      ...roles,
    };
    // save parameters
    JSONUtilities.writeJson(parametersJSONFilePath, parameters);
  };
}
