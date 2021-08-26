import * as fs from 'fs-extra';
import * as path from 'path';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { CLIInputSchemaValidator } from 'amplify-cli-core';

export type AuthInputStateOptions = {
  fileName: string;
  inputAuthPayload?: ServiceQuestionsResult;
  category: string;
  service: string;
  resourceName: string;
};

export class AuthInputState {
  static authInputState: AuthInputState;
  _service: string;
  _filePath: string;
  _resourceName: string;
  _category: string;
  _authInputPayload?: ServiceQuestionsResult;

  constructor(props: AuthInputStateOptions) {
    this._category = AmplifyCategories.AUTH;
    this._service = AmplifySupportedService.COGNITO;
    this._filePath = props.fileName;
    this._resourceName = props.resourceName;

    // write payload to file
    try {
      this._authInputPayload = props.inputAuthPayload ?? JSONUtilities.readJson(props.fileName, { throwIfNotExist: true });
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }

    // validate cli-inputs.json

    // validate cli-inputs.json
    const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, 'S3UserInputs');
    schemaValidator.validateInput(JSON.stringify(this._authInputPayload!));
  }

  public static getInstance(props: AuthInputStateOptions): AuthInputState {
    const projectPath = pathManager.findProjectRoot();
    if (!AuthInputState.authInputState) {
      AuthInputState.authInputState = new AuthInputState(props);
    }
    return AuthInputState.authInputState;
  }

  public getCliInputPayload(): ServiceQuestionsResult {
    if (this._authInputPayload) {
      return this._authInputPayload;
    } else {
      throw new Error('cli-inputs not present. Either add category or migrate project to support extensibility');
    }
  }

  public saveCliInputPayload(): void {
    fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._filePath, this._authInputPayload);
    } catch (e) {
      throw new Error(e);
    }
  }
}
