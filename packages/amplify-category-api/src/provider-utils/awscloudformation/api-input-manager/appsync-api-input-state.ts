import * as fs from 'fs-extra';
import * as path from 'path';
import {
  AmplifyCategories,
  AmplifySupportedService,
  JSONUtilities,
  pathManager,
  CLIInputSchemaValidator,
  CategoryInputState,
} from 'amplify-cli-core';
import { AppsyncCLIInputs } from '../service-walkthrough-types/appsync-user-input-types';
import _ from 'lodash';

export class AppsyncApiInputState extends CategoryInputState {
  #cliInputsFilePath: string; //cli-inputs.json (output) filepath
  #resourceName: string; //user friendly name provided by user
  #category: string; //category of the resource
  #service: string; //AWS service for the resource
  #buildFilePath: string;

  constructor(resourceName: string) {
    super(resourceName);
    this.#category = AmplifyCategories.API;
    this.#service = AmplifySupportedService.APPSYNC;
    this.#resourceName = resourceName;

    const projectBackendDirPath = pathManager.getBackendDirPath();
    this.#cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, this.#category, this.#resourceName, 'cli-inputs.json'));
    this.#buildFilePath = path.resolve(path.join(projectBackendDirPath, this.#category, this.#resourceName, 'build'));
  }

  public async isCLIInputsValid(cliInputs: AppsyncCLIInputs = this.getCLIInputPayload()): Promise<boolean> {
    const schemaValidator = new CLIInputSchemaValidator('appsync', this.#category, 'AppsyncCLIInputs');
    return schemaValidator.validateInput(JSON.stringify(cliInputs));
  }

  public getCLIInputPayload(): AppsyncCLIInputs {
    return JSONUtilities.readJson<AppsyncCLIInputs>(this.#cliInputsFilePath, { throwIfNotExist: true })!;
  }

  public cliInputFileExists(): boolean {
    return fs.existsSync(this.#cliInputsFilePath);
  }

  public async saveCLIInputPayload(cliInputs: AppsyncCLIInputs): Promise<void> {
    if (await this.isCLIInputsValid(cliInputs)) {
      fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this.#category, this.#resourceName));
      JSONUtilities.writeJson(this.#cliInputsFilePath, cliInputs);
    }
  }
}
