import {
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  CLIInputSchemaValidator,
  getMigrateResourceMessageForOverride,
  isResourceNameUnique,
  JSONUtilities,
  PathConstants,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { join } from 'path';
import { ApigwInputs, ApigwStackTransform, CrudOperation, Path, PermissionSetting } from './cdk-stack-builder';
import { convertDeperecatedRestApiPaths } from './convert-deprecated-apigw-paths';
import { ApigwWalkthroughReturnPromise } from './service-walkthrough-types/apigw-types';

export class ApigwInputState {
  projectRootPath: string;
  resourceName: string;
  paths: { [pathName: string]: Path };

  constructor(private readonly context: $TSContext, resourceName?: string) {
    this.projectRootPath = pathManager.findProjectRoot();
    this.resourceName = resourceName;
  }

  public addAdminQueriesResource = async (adminQueriesProps: AdminQueriesProps) => {
    this.resourceName = adminQueriesProps.apiName;
    this.paths = {
      '/{proxy+}': {
        lambdaFunction: adminQueriesProps.functionName,
        permissions: {
          setting: PermissionSetting.PRIVATE,
          auth: [CrudOperation.CREATE, CrudOperation.READ, CrudOperation.UPDATE, CrudOperation.DELETE],
        },
      },
    };

    await this.createApigwArtifacts();

    // Update amplify-meta and backend-config
    const backendConfigs = {
      service: AmplifySupportedService.APIGW,
      providerPlugin: 'awscloudformation',
      authorizationType: 'AMAZON_COGNITO_USER_POOLS',
      dependsOn: adminQueriesProps.dependsOn,
    };

    this.context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.API, adminQueriesProps.apiName, backendConfigs);
  };

  public updateAdminQueriesResource = async (adminQueriesProps: AdminQueriesProps) => {
    this.resourceName = adminQueriesProps.apiName;
    this.paths = {
      '/{proxy+}': {
        lambdaFunction: adminQueriesProps.functionName,
        permissions: {
          setting: PermissionSetting.PRIVATE,
          auth: [CrudOperation.CREATE, CrudOperation.READ, CrudOperation.UPDATE, CrudOperation.DELETE],
        },
      },
    };

    await this.createApigwArtifacts();

    this.context.amplify.updateamplifyMetaAfterResourceUpdate(
      AmplifyCategories.API,
      adminQueriesProps.apiName,
      'dependsOn',
      adminQueriesProps.dependsOn,
    );
  };

  public addApigwResource = async (serviceWalkthroughPromise: ApigwWalkthroughReturnPromise, options: $TSObject) => {
    const { answers } = await serviceWalkthroughPromise;

    this.resourceName = answers.resourceName;
    this.paths = answers.paths;
    options.dependsOn = answers.dependsOn;

    isResourceNameUnique(AmplifyCategories.API, this.resourceName);

    await this.createApigwArtifacts();

    this.context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.API, this.resourceName, options);
    return this.resourceName;
  };

  public updateApigwResource = async (updateWalkthroughPromise: Promise<$TSObject>) => {
    const { answers } = await updateWalkthroughPromise;

    this.resourceName = answers.resourceName;
    this.paths = answers.paths;

    await this.createApigwArtifacts();

    this.context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.API, this.resourceName, 'dependsOn', answers.dependsOn);
    return this.resourceName;
  };

  public migrateAdminQueries = async (adminQueriesProps: AdminQueriesProps) => {
    this.resourceName = this.resourceName ?? adminQueriesProps.apiName;
    if (!(await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.API, this.resourceName, true), true))) {
      return;
    }
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);

    fs.removeSync(join(resourceDirPath, PathConstants.ParametersJsonFileName));
    fs.removeSync(join(resourceDirPath, 'admin-queries-cloudformation-template.json'));

    return this.updateAdminQueriesResource(adminQueriesProps);
  };

  public migrateApigwResource = async (resourceName: string) => {
    this.resourceName = this.resourceName ?? resourceName;
    if (!(await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.API, this.resourceName, true), true))) {
      return;
    }
    const deprecatedParametersFileName = 'api-params.json';
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);
    const deprecatedParametersFilePath = join(resourceDirPath, deprecatedParametersFileName);
    this.paths = convertDeperecatedRestApiPaths(deprecatedParametersFileName, deprecatedParametersFilePath, this.resourceName);

    fs.removeSync(deprecatedParametersFilePath);
    fs.removeSync(join(resourceDirPath, PathConstants.ParametersJsonFileName));
    fs.removeSync(join(resourceDirPath, `${this.resourceName}-cloudformation-template.json`));

    await this.createApigwArtifacts();
  };

  public cliInputsFileExists() {
    return stateManager.resourceInputsJsonExists(this.projectRootPath, AmplifyCategories.API, this.resourceName);
  }

  public getCliInputPayload() {
    return stateManager.getResourceInputsJson(this.projectRootPath, AmplifyCategories.API, this.resourceName);
  }

  public isCLIInputsValid(cliInputs?: ApigwInputs) {
    if (!cliInputs) {
      cliInputs = this.getCliInputPayload();
    }

    const schemaValidator = new CLIInputSchemaValidator(AmplifySupportedService.APIGW, AmplifyCategories.API, 'APIGatewayCLIInputs');
    schemaValidator.validateInput(JSONUtilities.stringify(cliInputs));
  }

  private async createApigwArtifacts() {
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);
    fs.ensureDirSync(resourceDirPath);

    const buildDirPath = join(resourceDirPath, PathConstants.BuildDirName);
    fs.ensureDirSync(buildDirPath);

    stateManager.setResourceInputsJson(this.projectRootPath, AmplifyCategories.API, this.resourceName, { version: 1, paths: this.paths });

    stateManager.setResourceParametersJson(this.projectRootPath, AmplifyCategories.API, this.resourceName, {});

    const stack = new ApigwStackTransform(this.context, this.resourceName, this);
    await stack.transform();
  }
}

export type AdminQueriesProps = {
  apiName: string;
  functionName: string;
  authResourceName: string;
  dependsOn: $TSObject[];
};
