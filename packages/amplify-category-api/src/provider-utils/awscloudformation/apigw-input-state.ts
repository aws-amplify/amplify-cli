import {
  AmplifyCategories,
  $TSContext,
  $TSObject,
  CLIInputSchemaValidator,
  isResourceNameUnique,
  pathManager,
  PathConstants,
  stateManager,
} from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ApigwPath, ApigwWalkthroughReturnPromise } from './types/apigw-types';
import { ApigwInputs, ApigwStackTransform } from './cdk-stack-builder';

export class ApigwInputState {
  private static instance: ApigwInputState;
  projectRootPath: string;
  resourceName: string;
  paths: ApigwPath[];

  private constructor(private readonly context: $TSContext, resourceName?: string) {
    this.projectRootPath = pathManager.findProjectRoot();
    this.resourceName = resourceName;
    ApigwInputState.instance = this;
  }

  public static getInstance(context: $TSContext, resourceName?: string) {
    if (!ApigwInputState.instance) {
      ApigwInputState.instance = new ApigwInputState(context, resourceName);
    }
    return ApigwInputState.instance;
  }

  public addApigwResource = async (serviceWalkthroughPromise: ApigwWalkthroughReturnPromise, options: $TSObject) => {
    const { answers } = await serviceWalkthroughPromise;

    this.resourceName = answers.resourceName;
    this.paths = answers.paths;
    options.dependsOn = answers.dependsOn;

    isResourceNameUnique(AmplifyCategories.API, this.resourceName);

    // this.addPolicyResourceNameToPaths(answers.paths);
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

  public cliInputsFileExists() {
    const path = pathManager.getResourceInputsJsonFilePath(this.projectRootPath, AmplifyCategories.API, this.resourceName);
    return fs.existsSync(path);
  }

  public getCliInputPayload() {
    return stateManager.getResourceInputsJson(this.projectRootPath, AmplifyCategories.API, this.resourceName);
  }

  // TODO
  public isCLIInputsValid(cliInputs?: ApigwInputs) {
    if (!cliInputs) {
      cliInputs = this.getCliInputPayload();
    }

    const schemaValidator = new CLIInputSchemaValidator('API Gateway', AmplifyCategories.API, 'ApigwInputs');
    // schemaValidator.validateInput(JSONUtilities.stringify(cliInputs)); // TODO
  }

  async createApigwArtifacts() {
    const resourceDirPath = pathManager.getResourceDirectoryPath(this.projectRootPath, AmplifyCategories.API, this.resourceName);
    fs.ensureDirSync(resourceDirPath);

    const buildDirPath = path.join(resourceDirPath, PathConstants.BuildDirName);
    fs.ensureDirSync(buildDirPath);

    stateManager.setResourceInputsJson(this.projectRootPath, AmplifyCategories.API, this.resourceName, { paths: this.paths });

    stateManager.setResourceParametersJson(this.projectRootPath, AmplifyCategories.API, this.resourceName, {});

    const stack = new ApigwStackTransform(this.context, this.resourceName);
    await stack.transform();
  }

  // TODO - Remove if not needed
  // addPolicyResourceNameToPaths = () => {
  //   if (Array.isArray(this.paths)) {
  //     this.paths.forEach(p => {
  //       const pathName = p.name;
  //       if (typeof pathName === 'string') {
  //         p.policyResourceName = pathName.replace(/{[a-zA-Z0-9\-]+}/g, '*');
  //       }
  //     });
  //   }
  // }

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

enum CrudOperation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
