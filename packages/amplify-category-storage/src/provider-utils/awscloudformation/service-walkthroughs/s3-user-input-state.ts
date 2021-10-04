import { S3AccessType, S3PermissionType, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { CLIInputSchemaValidator } from 'amplify-cli-core';

import * as fs from 'fs-extra';
import * as path from 'path';

type ResourcRefType = {
  Ref: string;
};

export enum S3CFNPermissionType {
  PUT_OBJECT = 's3:PutObject',
  GET_OBJECT = 's3:GetObject',
  DELETE_OBJECT = 's3:DeleteObject',
  LIST_BUCKET = 's3:ListBucket',
}

export type S3CFNDependsOn = {
  category: string;
  resourceName: string;
  attributes: string[];
};

export type S3CLIWalkthroughParams = {
  resourceName: string;
  bucketName: string;
  authPolicyName: string;
  unauthPolicyName: string;
  authRoleName: ResourcRefType;
  unauthRoleName: ResourcRefType;
  storageAccess: S3AccessType;
  selectedGuestPermissions: S3CFNPermissionType[];
  selectedAuthenticatedPermissions: S3CFNPermissionType[];
  s3PermissionsAuthenticatedPublic: string;
  s3PublicPolicy: string;
  s3PermissionsAuthenticatedUploads: string;
  s3UploadsPolicy: string;
  s3PermissionsAuthenticatedProtected: string;
  s3ProtectedPolicy: string;
  s3PermissionsAuthenticatedPrivate: string;
  s3PrivatePolicy: string;
  AuthenticatedAllowList: string;
  s3ReadPolicy: string;
  s3PermissionsGuestPublic: string;
  s3PermissionsGuestUploads: string;
  GuestAllowList: string;
  triggerFunction: string;
  service: string;
  providerPlugin: string;
  dependsOn: S3CFNDependsOn[];
};

export type S3InputStateOptions = {
  userInputDataFilename: string; //cli-inputs.json
  resourceName: string;
  inputPayload?: S3UserInputs;
};

export class S3InputState {
  static s3InputState: S3InputState;
  _cliInputsFilePath: string; //cli-inputs.json (output) filepath
  _resourceName: string; //user friendly name provided by user
  _category: string; //category of the resource
  _service: string; //AWS service for the resource
  _inputPayload: S3UserInputs | undefined; //S3 options selected by user

  constructor(props: S3InputStateOptions) {
    this._category = AmplifyCategories.STORAGE;
    this._service = AmplifySupportedService.S3;
    this._cliInputsFilePath = props.userInputDataFilename;
    this._resourceName = props.resourceName;

    // Read cliInputs file if exists
    try {
      this._inputPayload = props.inputPayload ?? JSONUtilities.readJson(this._cliInputsFilePath, { throwIfNotExist: true });
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }

    // validate cli-inputs.json
    const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, 'S3UserInputs');
    schemaValidator.validateInput(JSON.stringify(this._inputPayload!));
  }

  public static getPermissionTypeFromCfnType(s3pPrmissionCfnType: S3CFNPermissionType): S3PermissionType {
    switch (s3pPrmissionCfnType) {
      case S3CFNPermissionType.PUT_OBJECT:
        return S3PermissionType.PUT_OBJECT;
      case S3CFNPermissionType.GET_OBJECT:
        return S3PermissionType.GET_OBJECT;
      case S3CFNPermissionType.DELETE_OBJECT:
        return S3PermissionType.DELETE_OBJECT;
      case S3CFNPermissionType.LIST_BUCKET:
        return S3PermissionType.LIST_BUCKET;
      default:
        throw new Error(`Unknown CFN Type: ${s3pPrmissionCfnType}`);
    }
  }

  public static getInputPermissionsFromCfnPermissions(selectedGuestPermissions: S3CFNPermissionType[] | undefined) {
    if (selectedGuestPermissions) {
      return selectedGuestPermissions.map(S3InputState.getPermissionTypeFromCfnType);
    } else {
      return [];
    }
  }

  public static cliWalkThroughToCliInputParams(cliInputsFilePath: string, options: S3CLIWalkthroughParams) {
    const inputProps: S3InputStateOptions = {
      userInputDataFilename: cliInputsFilePath,
      resourceName: options.resourceName,
      inputPayload: {
        resourceName: options.resourceName,
        bucketName: options.bucketName,
        storageAccess: options.storageAccess,
        selectedGuestPermissions: S3InputState.getInputPermissionsFromCfnPermissions(options.selectedGuestPermissions),
        selectedAuthenticatedPermissions: S3InputState.getInputPermissionsFromCfnPermissions(options.selectedAuthenticatedPermissions),
        isTriggerEnabled: options.triggerFunction !== 'NONE' ? true : false, //enable if trigger
        triggerFunctionName: options.triggerFunction !== 'NONE' ? options.triggerFunction : undefined,
      },
    };
    return inputProps;
  }

  updateInputPayload(props: S3InputStateOptions) {
    // Overwrite
    this._inputPayload = props.inputPayload;

    // validate cli-inputs.json
    const schemaValidator = new CLIInputSchemaValidator(this._service, this._category, 'S3UserInputs');
    schemaValidator.validateInput(JSON.stringify(this._inputPayload!));
  }

  public static getInstance(props: S3InputStateOptions): S3InputState {
    const projectPath = pathManager.findProjectRoot();
    if (!S3InputState.s3InputState) {
      S3InputState.s3InputState = new S3InputState(props);
    }
    S3InputState.s3InputState.updateInputPayload(props);
    return S3InputState.s3InputState;
  }

  public getCliInputPayload(): S3UserInputs {
    if (this._inputPayload) {
      return this._inputPayload;
    } else {
      throw new Error('cli-inputs not present. Either add category or migrate project to support extensibility');
    }
  }

  public saveCliInputPayload(): void {
    const backend = pathManager.getBackendDirPath();
    fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._cliInputsFilePath, this._inputPayload);
    } catch (e) {
      throw new Error(e);
    }
  }
}
