import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { HeadlessInputValidator, VersionedSchemaSupplier, VersionUpgradePipeline } from 'amplify-util-headless-input';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ServiceQuestionsResult } from '../service-walkthrough-types';

export const noopUpgradePipeline: VersionUpgradePipeline = () => [];

export type AuthInputStateOptions = {
  fileName: string;
  inputAuthPayload?: ServiceQuestionsResult;
  category: string;
  resourceName: string;
};

export class AuthInputState {
  static authInputState: AuthInputState;
  _filePath: string;
  _resourceName: string;
  _category: string;
  _authInputPayload: ServiceQuestionsResult | undefined;

  constructor(props: AuthInputStateOptions) {
    this._category = props.category;
    this._filePath = props.fileName;
    this._resourceName = props.resourceName;

    // write payload to file
    try {
      this._authInputPayload = props.inputAuthPayload ?? JSONUtilities.readJson(props.fileName, { throwIfNotExist: true });
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }

    // validate cli-inputs.json

    new HeadlessInputValidator(authCliInputsSchemaSupplier, noopUpgradePipeline).validate<ServiceQuestionsResult>(
      JSON.stringify(this._authInputPayload!),
    );
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
    const backend = pathManager.getBackendDirPath();
    fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._filePath, this._authInputPayload);
    } catch (e) {
      throw new Error(e);
    }
  }
}

const authCliInputsSchemaSupplier: VersionedSchemaSupplier = (version: number) => {
  return getSchema('ServiceQuestionsResult', 'cognito', version);
};

const getSchema = async (type: string, service: string, version: number) => {
  try {
    return {
      rootSchema: await import(`amplify-category-auth/resources/schemas/${service}/${version}/${type}.schema.json`),
    };
  } catch (ex) {
    return; // resolve the promise with void if the schema does not exist
  }
};
