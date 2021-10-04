import * as fs from 'fs-extra';
import * as path from 'path';
import {
  AmplifyCategories,
  AmplifySupportedService,
  JSONUtilities,
  pathManager,
  CLIInputSchemaValidator,
  CategoryInputState,
  FeatureFlags,
  $TSContext,
} from 'amplify-cli-core';
import { CognitoCLIInputs } from '../service-walkthrough-types/awsCognito-user-input-types';
import { AuthTriggerConnection, AuthTriggerPermissions, CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import _ from 'lodash';

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

  /**
   *
   * @param context Converts cli-inputs.json to CognitoStackParameters
   * @param cliInputs auth resource state
   * @returns previously selected cli-inputs
   */

  public async loadResourceParameters(context: $TSContext, cliInputs: CognitoCLIInputs): Promise<CognitoStackOptions> {
    const roles = {
      authRoleArn: {
        'Fn::GetAtt': ['AuthRole', 'Arn'],
      },
      unauthRoleArn: {
        'Fn::GetAtt': ['UnauthRole', 'Arn'],
      },
    };

    let parameters: CognitoStackOptions = {
      ...cliInputs.cognitoConfig,
      ...roles,
      breakCircularDependency: FeatureFlags.getBoolean('auth.breakcirculardependency'),
      dependsOn: [],
    };

    // determine permissions needed for each trigger module
    if (parameters.triggers && !_.isEmpty(parameters.triggers)) {
      parameters.triggers = JSON.stringify(parameters.triggers);
      // convert dependsOn
      let dependsOn;
      if (parameters.dependsOn && !_.isEmpty(parameters.dependsOn)) {
        dependsOn = parameters.dependsOn;
      } else {
        // generate dependsOn from cli-inputs
        const dependsOnKeys = Object.keys(parameters.triggers).map(i => `${parameters.resourceName}${i}`);
        dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
      }
      parameters = Object.assign(parameters, {
        triggers: parameters.triggers,
        dependsOn,
      });
    }
    return parameters;
  }
}
