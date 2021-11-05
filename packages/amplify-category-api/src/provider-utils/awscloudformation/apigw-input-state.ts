import {
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  CLIInputSchemaValidator,
  isResourceNameUnique,
  JSONUtilities,
  PathConstants,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { join } from 'path';
import { ApigwInputs, ApigwStackTransform, CrudOperation, Path, PermissionSetting } from './cdk-stack-builder';
import { ApigwWalkthroughReturnPromise } from './service-walkthrough-types/apigw-types';

export class ApigwInputState {
  private static instance: ApigwInputState;
  projectRootPath: string;
  resourceName: string;
  paths: { [pathName: string]: Path };

  private constructor(private readonly context: $TSContext, resourceName?: string) {
    this.projectRootPath = pathManager.findProjectRoot();
    this.resourceName = resourceName;
    ApigwInputState.instance = this;
  }

  public static getInstance(context: $TSContext, resourceName?: string) {
    if (!ApigwInputState.instance) {
      new ApigwInputState(context, resourceName);
    }
    return ApigwInputState.instance;
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

    await this.context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.API, adminQueriesProps.apiName, backendConfigs);
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

    await this.context.amplify.updateamplifyMetaAfterResourceUpdate(
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

    // this.addPolicyResourceNameToPaths(answers.paths);
    await this.createApigwArtifacts();

    this.context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.API, this.resourceName, 'dependsOn', answers.dependsOn);
    return this.resourceName;
  };

  public migrateAdminQueries = async (adminQueriesProps: AdminQueriesProps) => {
    this.resourceName = this.resourceName ?? adminQueriesProps.apiName;
    if (!(await prompter.confirmContinue(`Migration for ${this.resourceName} is required. Continue?`))) {
      return;
    }
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);

    this.context.filesystem.remove(join(resourceDirPath, PathConstants.ParametersJsonFileName));
    this.context.filesystem.remove(join(resourceDirPath, 'admin-queries-cloudformation-template.json'));

    return this.updateAdminQueriesResource(adminQueriesProps);
  };

  public migrateApigwResource = async (resourceName: string) => {
    this.resourceName = this.resourceName ?? resourceName;
    if (!(await prompter.confirmContinue(`Migration for ${this.resourceName} is required. Continue?`))) {
      return;
    }
    const deprecatedParametersFileName = 'api-params.json';
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);
    const deprecatedParametersFilePath = join(resourceDirPath, deprecatedParametersFileName);
    let deprecatedParameters: $TSObject;
    try {
      deprecatedParameters = JSONUtilities.readJson<$TSObject>(deprecatedParametersFilePath);
    } catch (e) {
      printer.error(`Error reading ${deprecatedParametersFileName} file for ${this.resourceName} resource`);
      throw e;
    }

    this.paths = {};

    function convertDeprecatedPermissionToCRUD(deprecatedPrivacy: string) {
      let privacyList: string[];
      if (deprecatedPrivacy === 'r') {
        privacyList = [CrudOperation.READ];
      } else if (deprecatedPrivacy === 'rw') {
        privacyList = [CrudOperation.CREATE, CrudOperation.READ, CrudOperation.UPDATE, CrudOperation.DELETE];
      }
      return privacyList;
    }

    deprecatedParameters.paths.forEach((path: $TSObject) => {
      let pathPermissionSetting =
        path.privacy.open === true
          ? PermissionSetting.OPEN
          : path.privacy.private === true
          ? PermissionSetting.PRIVATE
          : PermissionSetting.PROTECTED;

      let auth;
      let guest;
      // convert deprecated permissions to CRUD structure
      if (path.privacy.auth && ['r', 'rw'].includes(path.privacy.auth)) {
        auth = convertDeprecatedPermissionToCRUD(path.privacy.auth);
      }
      if (path.privacy.unauth && ['r', 'rw'].includes(path.privacy.unauth)) {
        auth = convertDeprecatedPermissionToCRUD(path.privacy.unauth);
      }

      this.paths[path.name] = {
        permissions: {
          setting: pathPermissionSetting,
          auth,
          guest,
        },
        lambdaFunction: path.lambdaFunction,
      };
    });

    await this.createApigwArtifacts();

    this.context.filesystem.remove(deprecatedParametersFilePath);
    this.context.filesystem.remove(join(resourceDirPath, PathConstants.ParametersJsonFileName));
    this.context.filesystem.remove(join(resourceDirPath, PathConstants.CfnFileName(this.resourceName)));
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

    const stack = new ApigwStackTransform(this.context, this.resourceName);
    await stack.transform();
  }

  convertCrudOperationsToPermissions(crudOps: CrudOperation[]) {
    const output = [];
    for (const op of crudOps) {
      switch (op) {
        case CrudOperation.CREATE:
          output.push('/POST');
          break;
        case CrudOperation.READ:
          output.push('/GET');
          break;
        case CrudOperation.UPDATE:
          output.push('/PUT');
          output.push('/PATCH');
          break;
        case CrudOperation.DELETE:
          output.push('/DELETE');
          break;
      }
    }
    return output;
  }
}

type AdminQueriesProps = {
  apiName: string;
  functionName: string;
  authResourceName: string;
  dependsOn: $TSObject[];
};
