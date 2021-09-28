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
} from 'amplify-cli-core';
import { AuthStackSythesizer } from './stack-synthesizer';
import * as cdk from '@aws-cdk/core';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import * as path from 'path';
import { AmplifyUserPoolGroupStack } from './auth-user-pool-group-stack-builder';
import * as amplifyPrinter from 'amplify-prompts';
import _ from 'lodash';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { getAuthResourceName } from '../../../utils/getAuthResourceName';

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
  _synthesizer: AuthStackSythesizer;
  _authResourceName: string;
  _category: string;
  _service: string;
  _resourceName: string;
  _cliInputs: CognitoCLIInputs;

  constructor(resourceName: string) {
    super(resourceName);
    this._resourceName = 'userPoolGroups';
    this._authResourceName = resourceName;
    this._synthesizer = new AuthStackSythesizer();
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

    // generate CFN outputs
    //TODO: same output params as root stack
    if (props.identityPoolName) {
      props.groups.forEach(group => {
        this._userPoolGroupTemplateObj.addCfnOutput(
          {
            value: cdk.Fn.getAtt(`${group.groupName}GroupRole`, 'Arn').toString(),
          },
          `${group.groupName}GroupRoleOutput`,
        );
      });
    }
  };

  public applyOverride = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = path.join(backendDir, this._category, this._resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir).catch(error => {
      amplifyPrinter.printer.warn(`Skipping build as ${error.message}`);
      return false;
    });
    if (isBuild) {
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
      const cognitoStackTemplateObj = this._userPoolGroupTemplateObj as AmplifyUserPoolGroupStack & AmplifyStackTemplate;
      //TODO: Check Script Options
      if (typeof overrideProps === 'function' && overrideProps) {
        try {
          this._userPoolGroupTemplateObj = overrideProps(cognitoStackTemplateObj);

          //The vm module enables compiling and running code within V8 Virtual Machine contexts. The vm module is not a security mechanism. Do not use it to run untrusted code.
          // const script = new vm.Script(overrideCode);
          // script.runInContext(vm.createContext(cognitoStackTemplateObj));
          return;
        } catch (error) {
          throw new Error(`Error while override resource ${this._resourceName}`);
        }
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
    return templates.get('AmplifyUserPoolGroupStack')!;
  };

  public saveBuildFiles = async (context: $TSContext, template: Template): Promise<void> => {
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
