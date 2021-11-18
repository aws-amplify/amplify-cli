import { AmplifyCategories, AmplifySupportedService, CLIInputSchemaValidator, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AppSyncCLIInputs } from '../service-walkthrough-types/appsync-user-input-types';

export class AppsyncApiInputState {
  #cliInputsFilePath: string; //cli-inputs.json (output) filepath
  #resourceName: string; //user friendly name provided by user
  #category: string; //category of the resource
  #service: string; //AWS service for the resource
  #buildFilePath: string;

  constructor(resourceName: string) {
    this.#category = AmplifyCategories.API;
    this.#service = AmplifySupportedService.APPSYNC;
    this.#resourceName = resourceName;

    const projectBackendDirPath = pathManager.getBackendDirPath();
    this.#cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, this.#category, this.#resourceName, 'cli-inputs.json'));
    this.#buildFilePath = path.resolve(path.join(projectBackendDirPath, this.#category, this.#resourceName, 'build'));
  }

  public async isCLIInputsValid(cliInputs: AppSyncCLIInputs = this.getCLIInputPayload()): Promise<boolean> {
    const schemaValidator = new CLIInputSchemaValidator('appsync', this.#category, 'AppSyncCLIInputs');
    return schemaValidator.validateInput(JSON.stringify(cliInputs));
  }

  public getCLIInputPayload(): AppSyncCLIInputs {
    return JSONUtilities.readJson<AppSyncCLIInputs>(this.#cliInputsFilePath, { throwIfNotExist: true })!;
  }

  public cliInputFileExists(): boolean {
    return fs.existsSync(this.#cliInputsFilePath);
  }

  public async saveCLIInputPayload(cliInputs: AppSyncCLIInputs): Promise<void> {
    if (await this.isCLIInputsValid(cliInputs)) {
      fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this.#category, this.#resourceName));
      JSONUtilities.writeJson(this.#cliInputsFilePath, cliInputs);
    }
  }
}
