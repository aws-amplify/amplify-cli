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
import { CognitoStackOptions } from '../service-walkthrough-types/cognito-user-input-types';
import _ from 'lodash';

export class AuthInputState extends CategoryInputState {
  #cliInputsFilePath: string; //cli-inputs.json (output) filepath
  #resourceName: string; //user friendly name provided by user
  #category: string; //category of the resource
  #service: string; //AWS service for the resource
  #buildFilePath: string;

  constructor(resourceName: string) {
    super(resourceName);
    this.#category = AmplifyCategories.AUTH;
    this.#service = AmplifySupportedService.COGNITO;
    this.#resourceName = resourceName;

    const projectBackendDirPath = pathManager.getBackendDirPath();
    this.#cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.AUTH, resourceName, 'cli-inputs.json'));
    this.#buildFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.AUTH, resourceName, 'build'));
  }

  public async isCLIInputsValid(cliInputs: CognitoCLIInputs = this.getCLIInputPayload()): Promise<boolean> {
    const schemaValidator = new CLIInputSchemaValidator('awsCognito', this.#category, 'CognitoCLIInputs');
    return schemaValidator.validateInput(JSON.stringify(cliInputs));
  }

  public getCLIInputPayload(): CognitoCLIInputs {
    return JSONUtilities.readJson<CognitoCLIInputs>(this.#cliInputsFilePath, { throwIfNotExist: true })!;
  }

  public cliInputFileExists(): boolean {
    return fs.existsSync(this.#cliInputsFilePath);
  }

  public async saveCLIInputPayload(cliInputs: CognitoCLIInputs): Promise<void> {
    // converting stringified triggers to object
    if (!_.isEmpty(cliInputs.cognitoConfig.triggers)) {
      cliInputs.cognitoConfig.triggers =
        typeof cliInputs.cognitoConfig.triggers === 'string'
          ? JSONUtilities.parse(cliInputs.cognitoConfig.triggers)
          : cliInputs.cognitoConfig.triggers;
    }
    if (await this.isCLIInputsValid(cliInputs)) {
      fs.ensureDirSync(path.join(pathManager.getBackendDirPath(), this.#category, this._resourceName));
      JSONUtilities.writeJson(this.#cliInputsFilePath, cliInputs);
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
    if (!_.isEmpty(parameters.triggers)) {
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
    } else {
      if (parameters.triggers) {
        parameters.triggers = JSON.stringify(parameters.triggers);
      }
    }
    return parameters;
  }
}
