import * as fs from 'fs-extra';
import * as path from 'path';
import { CognitoCLIInputs } from '../service-walkthrough-types/cognito-user-input-types';
import { AmplifyCategories, AmplifySupportedService, JSONUtilities, pathManager } from 'amplify-cli-core';
import { CLIInputSchemaValidator, CategoryInputState } from 'amplify-cli-core';

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

  public isCLIInputsValid(cliInputs?: CognitoCLIInputs) {
    if (!cliInputs) {
      cliInputs = this.getCliInputPayload();
    }
    try {
      const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, 'CognitoCLIInputs');
      schemaValidator.validateInput(JSON.stringify(cliInputs));
    } catch (e) {
      throw new Error(e);
    }
  }

  public getCliInputPayload(): CognitoCLIInputs {
    let cliInputs: CognitoCLIInputs;
    // Read cliInputs file if exists
    try {
      cliInputs = JSONUtilities.readJson(this._cliInputsFilePath, { throwIfNotExist: true }) as CognitoCLIInputs;
    } catch (error) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }

    return cliInputs;
  }

  public saveCliInputPayload(cliInputs: CognitoCLIInputs): void {
    this.isCLIInputsValid(cliInputs);

    fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
    } catch (e) {
      throw new Error(e);
    }
  }
}
