import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  CLIInputSchemaValidator,
  JSONUtilities,
  pathManager,
} from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getFieldType } from '../cfn-template-utils';
import { DynamoDBCLIInputs, DynamoDBCLIInputsGSIType } from '../service-walkthrough-types/dynamoDB-user-input-types';

/* Need to move this logic to a base class */

export class DynamoDBInputState {
  _cliInputsFilePath: string; //cli-inputs.json (output) filepath
  _resourceName: string; //user friendly name provided by user
  _category: string; //category of the resource
  _service: string; //AWS service for the resource
  buildFilePath: string;

  constructor(private readonly context: $TSContext, resourceName: string) {
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
      cliInputs = JSONUtilities.readJson<DynamoDBCLIInputs>(this._cliInputsFilePath)!;
    } catch (e) {
      throw new Error('cli-inputs.json file missing from the resource directory');
    }

    return cliInputs;
  }

  public cliInputFileExists(): boolean {
    return fs.existsSync(this._cliInputsFilePath);
  }

  public isCLIInputsValid(cliInputs?: DynamoDBCLIInputs) {
    if (!cliInputs) {
      cliInputs = this.getCliInputPayload();
    }

    const schemaValidator = new CLIInputSchemaValidator(this.context, this._service, this._category, 'DynamoDBCLIInputs');
    schemaValidator.validateInput(JSON.stringify(cliInputs));
  }

  public saveCliInputPayload(cliInputs: DynamoDBCLIInputs): void {
    this.isCLIInputsValid(cliInputs);

    fs.ensureDirSync(pathManager.getResourceDirectoryPath(undefined, this._category, this._resourceName));
    try {
      JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
    } catch (e) {
      throw new Error(e);
    }
  }

  public migrate() {
    // migrate the resource to new directory structure if cli-inputs.json is not found for the resource

    const backendDir = pathManager.getBackendDirPath();
    const oldParametersFilepath = path.join(backendDir, 'storage', this._resourceName, 'parameters.json');
    const oldCFNFilepath = path.join(backendDir, 'storage', this._resourceName, `${this._resourceName}-cloudformation-template.json`);
    const oldStorageParamsFilepath = path.join(backendDir, 'storage', this._resourceName, `storage-params.json`);

    const oldParameters = JSONUtilities.readJson<$TSAny>(oldParametersFilepath, { throwIfNotExist: true });
    const oldCFN = JSONUtilities.readJson<$TSAny>(oldCFNFilepath, { throwIfNotExist: true });
    const oldStorageParams = JSONUtilities.readJson<$TSAny>(oldStorageParamsFilepath, { throwIfNotExist: false }) || {};

    const partitionKey = {
      fieldName: oldParameters.partitionKeyName,
      fieldType: getFieldType(oldParameters.partitionKeyType),
    };

    let sortKey;

    if (oldParameters.sortKeyName) {
      sortKey = {
        fieldName: oldParameters.sortKeyName,
        fieldType: getFieldType(oldParameters.sortKeyType),
      };
    }

    let triggerFunctions = [];

    if (oldStorageParams.triggerFunctions) {
      triggerFunctions = oldStorageParams.triggerFunctions;
    }

    const getType = (attrList: $TSAny, attrName: string) => {
      let attrType;

      attrList.forEach((attr: $TSAny) => {
        if (attr.AttributeName === attrName) {
          attrType = getFieldType(attr.AttributeType);
        }
      });

      return attrType;
    };

    const gsi: DynamoDBCLIInputsGSIType[] = [];

    if (oldCFN?.Resources?.DynamoDBTable?.Properties?.GlobalSecondaryIndexes) {
      oldCFN.Resources.DynamoDBTable.Properties.GlobalSecondaryIndexes.forEach((cfnGSIValue: $TSAny) => {
        const gsiValue: $TSAny = {};
        (gsiValue.name = cfnGSIValue.IndexName),
          cfnGSIValue.KeySchema.forEach((keySchema: $TSObject) => {
            if (keySchema.KeyType === 'HASH') {
              gsiValue.partitionKey = {
                fieldName: keySchema.AttributeName,
                fieldType: getType(oldCFN.Resources.DynamoDBTable.Properties.AttributeDefinitions, keySchema.AttributeName),
              };
            } else {
              gsiValue.sortKey = {
                fieldName: keySchema.AttributeName,
                fieldType: getType(oldCFN.Resources.DynamoDBTable.Properties.AttributeDefinitions, keySchema.AttributeName),
              };
            }
          });
        gsi.push(gsiValue);
      });
    }
    const cliInputs: DynamoDBCLIInputs = {
      resourceName: this._resourceName,
      tableName: oldParameters.tableName,
      partitionKey,
      sortKey,
      triggerFunctions,
      gsi,
    };

    this.saveCliInputPayload(cliInputs);

    // Remove old files

    if (fs.existsSync(oldCFNFilepath)) {
      fs.removeSync(oldCFNFilepath);
    }
    if (fs.existsSync(oldParametersFilepath)) {
      fs.removeSync(oldParametersFilepath);
    }
    if (fs.existsSync(oldStorageParamsFilepath)) {
      fs.removeSync(oldStorageParamsFilepath);
    }
  }
}
