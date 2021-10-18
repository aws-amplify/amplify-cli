import * as cdk from '@aws-cdk/core';
import { App } from '@aws-cdk/core';
import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  buildOverrideDir,
  CLISubCommandType,
  IAmplifyResource,
  JSONUtilities,
  pathManager,
} from 'amplify-cli-core';
import { formatter, printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { S3PermissionType, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { canResourceBeTransformed, S3CFNDependsOn, S3CFNPermissionType, S3InputState } from '../service-walkthroughs/s3-user-input-state';
import { AmplifyS3ResourceCfnStack } from './s3-stack-builder';
import { AmplifyBuildParamsPermissions, AmplifyCfnParamType, AmplifyS3ResourceInputParameters, AmplifyS3ResourceTemplate } from './types';

/**
 * Builds S3 resource stack, ingest overrides.ts and generates output-files.
 * @param context CLI - Flow context
 * @param resource S3 resource to be transformed ( ingest overrides.ts and generate cloudformation )
 */
export async function transformS3ResourceStack(context: $TSContext, resource: IAmplifyResource): Promise<void> {
  if (canResourceBeTransformed(resource.resourceName)) {
    const stackGenerator = new AmplifyS3ResourceStackTransform(resource.resourceName, context);
    await stackGenerator.transform(CLISubCommandType.OVERRIDE);
  }
}

//Stack transformer for S3
export class AmplifyS3ResourceStackTransform {
  private app: App;
  private cliInputs: S3UserInputs;
  private resourceTemplateObj: AmplifyS3ResourceCfnStack | undefined;
  private cliInputsState: S3InputState;
  private cfn!: string;
  private cfnInputParams!: AmplifyS3ResourceInputParameters;
  private context: $TSContext;
  private resourceName: string;

  constructor(resourceName: string, context: $TSContext) {
    this.app = new App();
    // Validate the cli-inputs.json for the resource
    this.cliInputsState = new S3InputState(resourceName, undefined);
    this.cliInputs = this.cliInputsState.getCliInputPayload();
    this.context = context;
    this.resourceName = resourceName;
  }

  getCFN(): string | undefined {
    return this.cfn;
  }

  async transform(commandType: CLISubCommandType) {
    this.generateCfnInputParameters();

    // Generate cloudformation stack from cli-inputs.json
    await this.generateStack(this.context);

    // Modify cloudformation files based on overrides
    await this.applyOverrides();

    // Save generated cloudformation.json and parameters.json files
    this.saveBuildFiles(commandType);
  }

  /**
   * getS3DependsOn function is used to fetch all the dependencies of the S3 bucket (function, auth)
   * @returns All the dependsOn params to be inserted into amplify-meta by the category-level caller.
   */
  public getS3DependsOn(): S3CFNDependsOn[] | undefined {
    return this.resourceTemplateObj ? this.resourceTemplateObj.getS3DependsOn() : undefined;
  }

  generateCfnInputParameters() {
    const userInput: S3UserInputs = this.cliInputsState.getUserInput();

    const permissionCRUD = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
    const permissionCreate = [S3PermissionType.CREATE_AND_UPDATE];
    //DEFAULT Parameters
    const defaultS3PermissionsAuthenticatedPrivate = permissionCRUD;
    const defaultS3PermissionsAuthenticatedProtected = permissionCRUD;
    const defaultS3PermissionsAuthenticatedPublic = permissionCRUD;
    const defaultS3PermissionsAuthenticatedUploads = permissionCreate;
    const defaultS3PermissionsGuestPublic = permissionCRUD;
    const defaultS3PermissionsGuestUploads = permissionCreate;

    this.cfnInputParams = {
      bucketName: userInput.bucketName,
      selectedGuestPermissions: S3InputState.getCfnPermissionsFromInputPermissions(userInput.guestAccess),
      selectedAuthenticatedPermissions: S3InputState.getCfnPermissionsFromInputPermissions(userInput.authAccess),
      unauthRoleName: {
        Ref: 'UnauthRoleName',
      },
      authRoleName: {
        Ref: 'AuthRoleName',
      },
    };
    if (userInput.triggerFunction && userInput.triggerFunction !== 'NONE') {
      this.cfnInputParams.triggerFunction = userInput.triggerFunction;
    }
    this.cfnInputParams.s3PrivatePolicy = `Private_policy_${userInput.policyUUID}`;
    this.cfnInputParams.s3ProtectedPolicy = `Protected_policy_${userInput.policyUUID}`;
    this.cfnInputParams.s3PublicPolicy = `Public_policy_${userInput.policyUUID}`;
    this.cfnInputParams.s3ReadPolicy = `read_policy_${userInput.policyUUID}`;
    this.cfnInputParams.s3UploadsPolicy = `Uploads_policy_${userInput.policyUUID}`;
    this.cfnInputParams.authPolicyName = `s3_amplify_${userInput.policyUUID}`;
    this.cfnInputParams.unauthPolicyName = `s3_amplify_${userInput.policyUUID}`;
    this.cfnInputParams.AuthenticatedAllowList = this._getAuthGuestListPermission(S3PermissionType.READ, userInput.authAccess);
    this.cfnInputParams.GuestAllowList = this._getAuthGuestListPermission(S3PermissionType.READ, userInput.guestAccess);
    this.cfnInputParams.s3PermissionsAuthenticatedPrivate = this._getPublicPrivatePermissions(
      defaultS3PermissionsAuthenticatedPrivate,
      userInput.authAccess,
    );
    this.cfnInputParams.s3PermissionsAuthenticatedProtected = this._getPublicPrivatePermissions(
      defaultS3PermissionsAuthenticatedProtected,
      userInput.authAccess,
    );
    this.cfnInputParams.s3PermissionsAuthenticatedPublic = this._getPublicPrivatePermissions(
      defaultS3PermissionsAuthenticatedPublic,
      userInput.authAccess,
    );
    this.cfnInputParams.s3PermissionsAuthenticatedUploads = this._getPublicPrivatePermissions(
      defaultS3PermissionsAuthenticatedUploads,
      userInput.authAccess,
    );
    this.cfnInputParams.s3PermissionsGuestPublic = this._getPublicPrivatePermissions(
      defaultS3PermissionsGuestPublic,
      userInput.guestAccess,
    );
    this.cfnInputParams.s3PermissionsGuestUploads = this._getPublicPrivatePermissions(
      defaultS3PermissionsGuestUploads,
      userInput.guestAccess,
    );
  }

  _getAuthGuestListPermission(checkOperation: S3PermissionType, authPermissions: Array<S3PermissionType> | undefined) {
    if (authPermissions) {
      if (authPermissions.includes(checkOperation)) {
        return AmplifyBuildParamsPermissions.ALLOW;
      } else {
        return AmplifyBuildParamsPermissions.DISALLOW;
      }
    } else {
      return AmplifyBuildParamsPermissions.DISALLOW;
    }
  }

  _getPublicPrivatePermissions(checkOperationList: Array<S3PermissionType>, authPermissions: Array<S3PermissionType> | undefined) {
    if (authPermissions) {
      for (const permission of checkOperationList) {
        if (!authPermissions.includes(permission)) {
          return AmplifyBuildParamsPermissions.DISALLOW;
        }
      }
      const cfnPermissions: Array<S3CFNPermissionType> = S3InputState.getCfnPermissionsFromInputPermissions(checkOperationList);
      return cfnPermissions.join();
    }
    return AmplifyBuildParamsPermissions.DISALLOW;
  }

  // Modify cloudformation files based on overrides
  async applyOverrides() {
    const backendDir = pathManager.getBackendDirPath();
    const overrideFilePath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.STORAGE, this.resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideFilePath).catch(error => {
      printer.warn(`Skipping build as ${error.message}`);
      return false;
    });
    //Skip if packageManager or override.ts not found
    if (isBuild) {
      const { overrideProps } = await import(path.join(overrideFilePath, 'build', 'override.js')).catch(error => {
        formatter.list(['No override File Found', `To override ${this.resourceName} run amplify override auth ${this.resourceName} `]);
        return undefined;
      });
      // Pass stack object
      if (overrideProps && typeof overrideProps === 'function') {
        try {
          this.resourceTemplateObj = overrideProps(this.resourceTemplateObj as AmplifyS3ResourceTemplate);
          //The vm module enables compiling and running code within V8 Virtual Machine contexts. The vm module is not a security mechanism. Do not use it to run untrusted code.
          // const script = new vm.Script(overrideCode);
          // script.runInContext(vm.createContext(cognitoStackTemplateObj));
          return;
        } catch (error: $TSAny) {
          throw new Error(error);
        }
      }
    }
  }

  saveBuildFiles(commandType: CLISubCommandType) {
    if (this.resourceTemplateObj) {
      // Render CFN Template string and store as member in this.cfn
      this.cfn = this.resourceTemplateObj.renderCloudFormationTemplate();
    }

    //Store cloudformation-template.json, Parameters.json and Update BackendConfig
    this._saveFilesToLocalFileSystem('cloudformation-template.json', this.cfn);
    this._saveFilesToLocalFileSystem('parameters.json', this.cfnInputParams);

    /*
     ** Save DependsOn into Amplify-Meta:
     ** In case of ADD walkthrough, since the resource-entry in amplify-meta is created by the caller (addResource())
     ** we don't save the dependsOn here. In all other cases, the resource-entry is updated with the new dependsOn entry
     */
    if (commandType !== CLISubCommandType.ADD) {
      this._saveDependsOnToBackendConfig();
    }
  }

  async generateStack(context: $TSContext): Promise<void> {
    // Create Resource Stack from CLI Inputs in this._resourceTemplateObj
    this.resourceTemplateObj = new AmplifyS3ResourceCfnStack(this.app, 'AmplifyS3ResourceStack', this.cliInputs, this.cfnInputParams);

    // Add Parameters
    this.resourceTemplateObj.addParameters();

    // Add Conditions
    this.resourceTemplateObj.addConditions();

    // Add Outputs
    this.resourceTemplateObj.addOutputs();

    /*
     ** Generate Stack Resources for the S3 resource
     **
     * 1. Create the S3 bucket, configure CORS and create CFN Conditions
     * 2. Configure Notifications on the S3 bucket.
     * 3. Create IAM policies to control Cognito pool access to S3 bucket
     * 4. Configure Cognito User pool policies
     * 5. Configure Trigger policies
     */
    await this.resourceTemplateObj.generateCfnStackResources(context);
  }

  _addOutputs() {
    this.resourceTemplateObj?.addCfnOutput(
      {
        value: cdk.Fn.ref('S3Bucket'),
        description: 'Bucket name for the S3 bucket',
      },
      'BucketName',
    );
    this.resourceTemplateObj?.addCfnOutput(
      {
        value: cdk.Fn.ref('AWS::Region'),
      },
      'Region',
    );
  }

  _addParameters() {
    let s3CfnParams: Array<AmplifyCfnParamType> = [
      {
        params: ['env', 'bucketName', 'authPolicyName', 'unauthPolicyName', 'authRoleName', 'unauthRoleName', 'triggerFunction'],
        paramType: 'String',
      },
      {
        params: ['s3PublicPolicy', 's3PrivatePolicy', 's3ProtectedPolicy', 's3UploadsPolicy', 's3ReadPolicy'],
        paramType: 'String',
        default: 'NONE',
      },
      {
        params: [
          's3PermissionsAuthenticatedPublic',
          's3PermissionsAuthenticatedProtected',
          's3PermissionsAuthenticatedPrivate',
          's3PermissionsAuthenticatedUploads',
          's3PermissionsGuestPublic',
          's3PermissionsGuestUploads',
          'AuthenticatedAllowList',
          'GuestAllowList',
        ],
        paramType: 'String',
        default: AmplifyBuildParamsPermissions.DISALLOW,
      },
      {
        params: ['selectedGuestPermissions', 'selectedAuthenticatedPermissions'],
        paramType: 'CommaDelimitedList',
        default: 'NONE',
      },
    ];

    s3CfnParams.map(params => this._setCFNParams(params));
  }

  //Helper: Add CFN Resource Param definitions as CfnParameter .
  _setCFNParams(paramDefinitions: AmplifyCfnParamType) {
    const resourceTemplateObj = this.resourceTemplateObj;
    if (resourceTemplateObj) {
      paramDefinitions.params.map(paramName => {
        //set param type
        let cfnParam: any = {
          type: paramDefinitions.paramType,
        };
        //set param default if provided
        if (paramDefinitions.default) {
          cfnParam.default = paramDefinitions.default;
        }
        //configure param in resource template object
        resourceTemplateObj.addCfnParameter(cfnParam, paramName);
      });
    } //else throw an exception TBD
  }

  //Helper: Save files in local-filesysten
  _saveFilesToLocalFileSystem(fileName: string, data: $TSAny) {
    fs.ensureDirSync(this.cliInputsState.buildFilePath);
    const cfnFilePath = path.resolve(path.join(this.cliInputsState.buildFilePath, fileName));
    try {
      JSONUtilities.writeJson(cfnFilePath, data);
    } catch (e) {
      throw e;
    }
  }

  //Helper: Save DependsOn entries to backend-config.json
  _saveDependsOnToBackendConfig() {
    if (this.resourceTemplateObj) {
      //Get all collated resource dependencies
      const s3DependsOnResources = this.resourceTemplateObj.getS3DependsOn();
      if (s3DependsOnResources && s3DependsOnResources.length > 0) {
        this.context.amplify.updateamplifyMetaAfterResourceUpdate(
          AmplifyCategories.STORAGE,
          this.resourceName,
          'dependsOn',
          s3DependsOnResources,
        );
      }
    }
  }
}
