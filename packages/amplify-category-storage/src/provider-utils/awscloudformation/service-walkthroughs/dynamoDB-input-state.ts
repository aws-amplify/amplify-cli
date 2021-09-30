import { DynamoDBCLIInputs } from '../service-walkthrough-types/dynamoDB-user-input-types';
import { AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { CLIInputSchemaValidator } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';

/* Need to move this logic to a base class */

export class DynamoDBInputState {
  _cliInputsFilePath: string; //cli-inputs.json (output) filepath
  _resourceName: string; //user friendly name provided by user
  _category: string; //category of the resource
  _service: string; //AWS service for the resource
  buildFilePath: string;

  constructor(resourceName: string) {
    this._category = AmplifyCategories.STORAGE;
    this._service = AmplifySupportedService.DYNAMODB;
    this._resourceName = resourceName;

    const projectBackendDirPath = pathManager.getBackendDirPath();
    this._cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.STORAGE, resourceName, 'cli-inputs.json'));
    this.buildFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.STORAGE, resourceName, 'build'));
  }

  public getCliInputPayload(): DynamoDBCLIInputs {
    let cliInputs: DynamoDBCLIInputs;
    // Read cliInputs file if exists
    try {
      cliInputs = JSON.parse(fs.readFileSync(this._cliInputsFilePath, 'utf8'));
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }

    return cliInputs;
  }

  public isCLIInputsValid(cliInputs?: DynamoDBCLIInputs) {
    if (!cliInputs) {
      cliInputs = this.getCliInputPayload();
    }

    /*const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, "DynamoDBCLIInputs" );
  schemaValidator.validateInput(JSON.stringify(cliInputs));*/
  }

  public saveCliInputPayload(cliInputs: DynamoDBCLIInputs): void {
    this.isCLIInputsValid(cliInputs);

    fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
    } catch (e) {
      throw new Error(e);
    }
  }
}
