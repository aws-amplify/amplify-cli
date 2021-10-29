import * as cdk from '@aws-cdk/core';
import {
  AmplifyCategories,
  buildOverrideDir,
  $TSAny,
  $TSContext,
  JSONUtilities,
  pathManager,
  PathConstants,
  stateManager,
  Template,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { formatter, printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { category } from '../../../category-constants';
import { ApigwInputState } from '../apigw-input-state';
import { AmplifyApigwResourceStack, ApigwInputs } from '.';

export class ApigwStackTransform {
  _app: cdk.App;
  cliInputs: ApigwInputs;
  resourceTemplateObj: AmplifyApigwResourceStack | undefined;
  cliInputsState: ApigwInputState;
  cfn!: Template;
  cfnInputParams!: {}; // AmplifyApigwResourceInputParameters; // TODO
  resourceName: string;

  constructor(context: $TSContext, resourceName: string) {
    this._app = new cdk.App();
    this.resourceName = resourceName;

    // Validate the cli-inputs.json for the resource
    this.cliInputsState = ApigwInputState.getInstance(context);
    this.cliInputs = this.cliInputsState.getCliInputPayload();
    this.cliInputsState.isCLIInputsValid();
  }

  async transform() {
    // Generate cloudformation stack from cli-inputs.json
    this.generateStack();

    // Generate cloudformation stack input params from cli-inputs.json
    this.generateCfnInputParameters();

    // Modify cloudformation files based on overrides
    await this.applyOverrides();

    // Save generated cloudformation.json and parameters.json files
    await this.saveBuildFiles();
  }

  // TODO generate params
  generateCfnInputParameters() {
    this.cfnInputParams = {};
  }

  generateStack() {
    this.resourceTemplateObj = new AmplifyApigwResourceStack(this._app, 'AmplifyApigwResourceStack', this.cliInputs);

    // Add Parameters
    for (const path of this.cliInputs.paths) {
      this.resourceTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: `function${path.lambdaFunction}Name`,
        },
        `function${path.lambdaFunction}Name`,
      );
      this.resourceTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: `function${path.lambdaFunction}Arn`,
        },
        `function${path.lambdaFunction}Arn`,
      );
    }

    this.resourceTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );

    // Add conditions
    this.resourceTemplateObj.addCfnCondition(
      {
        expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
      },
      'ShouldNotCreateEnvResources',
    );

    // Add outputs
    this.resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.join('', [
          'https://',
          this.cliInputsState.resourceName,
          '.execute-api.',
          cdk.Fn.ref('AWS::Region'),
          '.amazonaws.com/',
          cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')) as unknown as string,
        ]),
        description: 'Root URL of the API gateway',
      },
      'RootUrl',
    );

    this.resourceTemplateObj.addCfnOutput(
      {
        value: this.resourceName,
        description: 'API Friendly name',
      },
      'ApiName',
    );

    this.resourceTemplateObj.addCfnOutput(
      {
        value: cdk.Fn.ref(this.resourceName),
        description: 'API ID (prefix of API URL)',
      },
      'ApiId',
    );

    // this.resourceTemplateObj.addCfnOutput(
    //   {
    //     value: cdk.Fn.ref('AWS::Region'),
    //   },
    //   'Region',
    // );

    // Add resources
    this.resourceTemplateObj.generateStackResources(this.resourceName);
  }

  async applyOverrides() {
    const backendDir = pathManager.getBackendDirPath();
    const overrideFilePath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, this.resourceName);

    const isBuild = await buildOverrideDir(backendDir, overrideFilePath).catch(error => {
      printer.debug(`Skipping build as ${error.message}`);
      return false;
    });
    // skip if packageManager or override.ts not found
    if (isBuild) {
      const { overrideProps } = await import(path.join(overrideFilePath, 'build', 'override.js')).catch(error => {
        formatter.list(['No override file found', `To override ${this.resourceName} run amplify override auth ${this.resourceName} `]);
        return undefined;
      });

      // TODO: Check Script Options
      if (typeof overrideProps === 'function' && overrideProps) {
        try {
          this.resourceTemplateObj = overrideProps(this.resourceTemplateObj);

          // The vm module enables compiling and running code within V8 Virtual Machine contexts.
          // The vm module is not a security mechanism. Do not use it to run untrusted code.
          // const script = new vm.Script(overrideCode);
          // script.runInContext(vm.createContext(cognitoStackTemplateObj));
          return;
        } catch (error: $TSAny) {
          throw new Error(error);
        }
      }
    }
  }

  async saveBuildFiles() {
    if (this.resourceTemplateObj) {
      this.cfn = JSONUtilities.parse(this.resourceTemplateObj.renderCloudFormationTemplate());
    }

    const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, category, this.resourceName);
    fs.ensureDirSync(resourceDirPath);

    const buildDirPath = path.join(resourceDirPath, PathConstants.BuildDirName);
    fs.ensureDirSync(buildDirPath);

    stateManager.setResourceParametersJson(undefined, AmplifyCategories.API, this.resourceName, this.cfnInputParams);

    const cfnFilePath = path.resolve(path.join(buildDirPath, `${this.resourceName}-cloudformation-template.json`));
    return writeCFNTemplate(this.cfn, cfnFilePath);
  }
}
