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
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';

export class AuthInputState extends CategoryInputState {
  _cliInputsFilePath: string; //cli-inputs.json (output) filepath
  _resourceName: string; //user friendly name provided by user
  _category: string; //category of the resource
  _service: string; //AWS service for the resource
  _buildFilePath: string;

  constructor(resourceName: string) {
    super(resourceName);
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITO;
    this._resourceName = resourceName;

    const projectBackendDirPath = pathManager.getBackendDirPath();
    this._cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.AUTH, resourceName, 'cli-inputs.json'));
    this._buildFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.AUTH, resourceName, 'build'));
  }

  public async isCLIInputsValid(cliInputs?: CognitoCLIInputs): Promise<boolean> {
    if (!cliInputs) {
      cliInputs = this.getCLIInputPayload();
    }
    const schemaValidator = new CLIInputSchemaValidator('awsCognito', this._category, 'CognitoCLIInputs');
    try {
      return await schemaValidator.validateInput(JSON.stringify(cliInputs));
    } catch (e) {
      throw e;
    }
  }

  public getCLIInputPayload(): CognitoCLIInputs {
    let cliInputs: CognitoCLIInputs;
    cliInputs = JSONUtilities.readJson(this._cliInputsFilePath, { throwIfNotExist: true }) as CognitoCLIInputs;
    return cliInputs;
  }

  public async saveCLIInputPayload(cliInputs: CognitoCLIInputs): Promise<void> {
    if (await this.isCLIInputsValid(cliInputs)) {
      fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
      JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
    }
  }
}
