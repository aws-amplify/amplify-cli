import * as fs from 'fs-extra';
import * as path from 'path';
import { ServiceQuestionsResult } from '../service-walkthrough-types';
import { AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { CLIInputSchemaValidator } from 'amplify-category-plugin-interface';

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

    try {
      this._authInputPayload = props.inputAuthPayload ?? JSONUtilities.readJson(props.fileName, { throwIfNotExist: true });
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }
  }

  public static async getInstance(props: AuthInputStateOptions): Promise<AuthInputState> {
    if (!AuthInputState.authInputState) {
      AuthInputState.authInputState = new AuthInputState(props);
    }

    await AuthInputState.authInputState.validateCliInput();
    return AuthInputState.authInputState;
  }

  async validateCliInput() {
    const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, 'ServiceQuestionsResult');
    await schemaValidator.validateInput(JSON.stringify(this._authInputPayload!)).catch((err: string | undefined) => {
      throw new Error(err);
    });
  }

  public getCliInputPayload(): ServiceQuestionsResult {
    if (this._authInputPayload) {
      return this._authInputPayload;
    } else {
      throw new Error('cli-inputs not present. Either add category or migrate project to support extensibility');
    }
  }

  public saveCliInputPayload(): void {
    try {
      fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
      JSONUtilities.writeJson(this._filePath, this._authInputPayload);
    } catch (e) {
      throw new Error(e);
    }
  }
}
