import * as cdk from '@aws-cdk/core';
import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  buildOverrideDir,
  getAmplifyResourceByCategories,
  JSONUtilities,
  PathConstants,
  pathManager,
  stateManager,
  Template,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { formatter, printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as vm from 'vm2';
import { AmplifyApigwResourceStack, ApigwInputs, CrudOperation, Path } from '.';
import { category } from '../../../category-constants';
import { ApigwInputState } from '../apigw-input-state';
export class ApigwStackTransform {
  _app: cdk.App;
  cliInputs: ApigwInputs;
  resourceTemplateObj: AmplifyApigwResourceStack | undefined;
  cliInputsState: ApigwInputState;
  cfn!: Template;
  cfnInputParams!: $TSObject;
  resourceName: string;

  constructor(context: $TSContext, resourceName: string, cliInputState?: ApigwInputState) {
    this._app = new cdk.App();
    this.resourceName = resourceName;

    // Validate the cli-inputs.json for the resource
    this.cliInputsState = cliInputState ?? new ApigwInputState(context, resourceName);
    this.cliInputs = this.cliInputsState.getCliInputPayload();
    this.cliInputsState.isCLIInputsValid();
  }

  async transform() {
    let authResourceName: string;

    const pathsWithUserPoolGroups = Object.entries(this.cliInputs.paths).filter(([_, path]) => !!path?.permissions?.groups);

    if (this.resourceName === 'AdminQueries' || pathsWithUserPoolGroups.length > 0) {
      [authResourceName] = getAmplifyResourceByCategories(AmplifyCategories.AUTH).filter(resourceName => resourceName !== 'userPoolGroups');
    }

    // Generate cloudformation stack from cli-inputs.json
    this.generateStack(authResourceName, pathsWithUserPoolGroups);

    // Generate cloudformation stack input params from cli-inputs.json
    this.generateCfnInputParameters();

    // Modify cloudformation files based on overrides
    await this.applyOverrides();

    // Save generated cloudformation.json and parameters.json files
    await this.saveBuildFiles();
  }

  generateCfnInputParameters() {
    this.cfnInputParams = {};
  }

  generateStack(authResourceName?: string, pathsWithUserPoolGroups: [string, Path][] = []) {
    this.resourceTemplateObj = new AmplifyApigwResourceStack(this._app, 'AmplifyApigwResourceStack', this.cliInputs);

    if (authResourceName) {
      const authRoleLogicalId = `auth${authResourceName}UserPoolId`;
      this.resourceTemplateObj.addCfnParameter(
        {
          type: 'String',
          default: authRoleLogicalId,
        },
        authRoleLogicalId,
      );

      const uniqueUserPoolGroupsList = new Set<string>();
      for (const [pathName, path] of pathsWithUserPoolGroups) {
        for (const [groupName, crudOps] of Object.entries(path.permissions.groups)) {
          uniqueUserPoolGroupsList.add(groupName);
          this.resourceTemplateObj.addIamPolicyResourceForUserPoolGroup(
            this.resourceName,
            authRoleLogicalId,
            groupName,
            pathName,
            convertCrudOperationsToCfnPermissions(crudOps),
          );
        }
      }
      Array.from(uniqueUserPoolGroupsList).forEach(userPoolGroupName => {
        this.resourceTemplateObj.addCfnParameter(
          {
            type: 'String',
            default: `authuserPoolGroups${userPoolGroupName}GroupRole`,
          },
          `authuserPoolGroups${userPoolGroupName}GroupRole`,
        );
      });
    }

    // Add Parameters
    const addedFunctions = new Set();
    for (const path of Object.values(this.cliInputs.paths)) {
      if (!addedFunctions.has(path.lambdaFunction)) {
        addedFunctions.add(path.lambdaFunction);
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

    // Add resources
    this.resourceName === 'AdminQueries'
      ? this.resourceTemplateObj.generateAdminQueriesStack(this.resourceName, authResourceName)
      : this.resourceTemplateObj.generateStackResources(this.resourceName);
  }

  async applyOverrides() {
    const backendDir = pathManager.getBackendDirPath();
    const overrideFilePath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, this.resourceName);
    const overrideJSFilePath = path.join(overrideFilePath, 'build', 'override.js');

    const isBuild = await buildOverrideDir(backendDir, overrideFilePath).catch(error => {
      printer.debug(`Skipping build as ${error.message}`);
      return false;
    });

    // skip if packageManager or override.ts not found
    if (isBuild) {
      const { override } = await import(overrideJSFilePath).catch(error => {
        formatter.list(['No override file found', `To override ${this.resourceName} run "amplify override api"`]);
        return undefined;
      });

      if (override && typeof override === 'function') {
        const overrideCode: string = await fs.readFile(overrideJSFilePath, 'utf-8').catch(() => {
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
          await sandboxNode.run(overrideCode, overrideJSFilePath).override(this.resourceTemplateObj as AmplifyApigwResourceStack);
        } catch (err: $TSAny) {
          const error = new Error(`Skipping override due to ${err}.`);
          printer.error(`${error}`);
          error.stack = undefined;
          throw error;
        }
      }
    }
  }

  private async saveBuildFiles() {
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

function convertCrudOperationsToCfnPermissions(crudOps: CrudOperation[]) {
  const opMap: Record<CrudOperation, string[]> = {
    [CrudOperation.CREATE]: ['/POST'],
    [CrudOperation.READ]: ['/GET'],
    [CrudOperation.UPDATE]: ['/PUT', '/PATCH'],
    [CrudOperation.DELETE]: ['/DELETE'],
  };
  return crudOps.flatMap(op => opMap[op]);
}
