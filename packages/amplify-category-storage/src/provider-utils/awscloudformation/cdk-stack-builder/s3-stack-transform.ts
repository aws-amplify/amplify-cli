import * as cdk from 'aws-cdk-lib';
import { getProjectInfo } from '@aws-amplify/cli-extensibility-helper';
import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifyError,
  buildOverrideDir,
  CLISubCommandType,
  IAmplifyResource,
  JSONUtilities,
  pathManager,
  runOverride,
} from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { S3PermissionType, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
// eslint-disable-next-line import/no-cycle
import { canResourceBeTransformed, S3CFNDependsOn, S3CFNPermissionType, S3InputState } from '../service-walkthroughs/s3-user-input-state';
// eslint-disable-next-line import/no-cycle
import { AmplifyS3ResourceCfnStack } from './s3-stack-builder';
import { AmplifyBuildParamsPermissions, AmplifyCfnParamType, AmplifyS3ResourceInputParameters } from './types';

/**
 * Builds S3 resource stack, ingest overrides.ts and generates output-files.
 */
export const transformS3ResourceStack = async (context: $TSContext, resource: IAmplifyResource): Promise<void> => {
  if (canResourceBeTransformed(context, resource.resourceName)) {
    const stackGenerator = new AmplifyS3ResourceStackTransform(resource.resourceName, context);
    await stackGenerator.transform(CLISubCommandType.OVERRIDE);
  }
};

/**
 * Stack transformer for S3
 */
export class AmplifyS3ResourceStackTransform {
  private app: cdk.App;
  private cliInputs: S3UserInputs;
  private resourceTemplateObj: AmplifyS3ResourceCfnStack | undefined;
  private cliInputsState: S3InputState;
  private cfn!: string;
  private cfnInputParams!: AmplifyS3ResourceInputParameters;
  private context: $TSContext;
  private resourceName: string;

  constructor(resourceName: string, context: $TSContext) {
    this.app = new cdk.App();
    // Validate the cli-inputs.json for the resource
    this.cliInputsState = new S3InputState(context, resourceName, undefined);
    this.cliInputs = this.cliInputsState.getCliInputPayload();
    this.context = context;
    this.resourceName = resourceName;
  }

  /**
   * get generated cfn
   */
  getCFN(): string | undefined {
    return this.cfn;
  }

  /**
   * get cfn input params
   */
  getCFNInputParams(): AmplifyS3ResourceInputParameters {
    return this.cfnInputParams;
  }

  /**
   * transforms cli inputs to cloudformation stack
   */
  async transform(commandType: CLISubCommandType): Promise<void> {
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

  /**
   * generate cfn input parameters
   */
  generateCfnInputParameters = (): void => {
    const userInput: S3UserInputs = this.cliInputsState.getUserInput();
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
    if (userInput.adminTriggerFunction?.triggerFunction && userInput.adminTriggerFunction.triggerFunction !== 'NONE') {
      this.cfnInputParams.adminTriggerFunction = userInput.adminTriggerFunction.triggerFunction;
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
      userInput.authAccess,
      true, // exclude bucketList
    );
    this.cfnInputParams.s3PermissionsAuthenticatedProtected = this._getPublicPrivatePermissions(
      userInput.authAccess,
      true, // exclude bucketList
    );
    this.cfnInputParams.s3PermissionsAuthenticatedPublic = this._getPublicPrivatePermissions(
      userInput.authAccess,
      true, // exclude bucketList
    );
    this.cfnInputParams.s3PermissionsAuthenticatedUploads = this._getUploadPermissions(userInput.authAccess);
    this.cfnInputParams.s3PermissionsGuestPublic = this._getPublicPrivatePermissions(
      userInput.guestAccess,
      true, // exclude bucketList
    );
    this.cfnInputParams.s3PermissionsGuestUploads = this._getUploadPermissions(userInput.guestAccess);
  };

  /**
   * get auth guest users list permission
   */
  _getAuthGuestListPermission = (
    checkOperation: S3PermissionType,
    authPermissions: Array<S3PermissionType> | undefined,
  ): AmplifyBuildParamsPermissions => {
    if (authPermissions) {
      if (authPermissions.includes(checkOperation)) {
        return AmplifyBuildParamsPermissions.ALLOW;
      }
      return AmplifyBuildParamsPermissions.DISALLOW;
    }
    return AmplifyBuildParamsPermissions.DISALLOW;
  };

  /**
   * get permission for s3
   */
  _getPublicPrivatePermissions = (
    authPermissions: Array<S3PermissionType> | undefined,
    excludeListBuckets: boolean,
  ): AmplifyBuildParamsPermissions | string => {
    if (authPermissions) {
      let cfnPermissions: Array<S3CFNPermissionType> = S3InputState.getCfnPermissionsFromInputPermissions(authPermissions);
      if (excludeListBuckets) {
        cfnPermissions = cfnPermissions.filter((permissions) => permissions !== S3CFNPermissionType.LIST);
      }
      return cfnPermissions && cfnPermissions.length > 0 ? cfnPermissions.join() : AmplifyBuildParamsPermissions.DISALLOW;
    }
    return AmplifyBuildParamsPermissions.DISALLOW;
  };

  /**
   * get upload permissions for s3
   */
  _getUploadPermissions = (authPermissions: Array<S3PermissionType> | undefined): AmplifyBuildParamsPermissions | string => {
    if (authPermissions) {
      if (!authPermissions.includes(S3PermissionType.CREATE_AND_UPDATE)) {
        return AmplifyBuildParamsPermissions.DISALLOW;
      }
      // For uploads only set "s3:PutObject"
      const cfnPermissions: Array<S3CFNPermissionType> = S3InputState.getCfnTypesFromPermissionType(S3PermissionType.CREATE_AND_UPDATE);
      return cfnPermissions.join();
    }
    return AmplifyBuildParamsPermissions.DISALLOW;
  };

  /**
   * Modify cloudformation files based on overrides
   */
  applyOverrides = async (): Promise<void> => {
    const backendDir = pathManager.getBackendDirPath();
    const overrideDir = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.STORAGE, this.resourceName);
    const isBuild = await buildOverrideDir(backendDir, overrideDir);
    // Skip if packageManager or override.ts not found
    if (isBuild) {
      const projectInfo = getProjectInfo();
      try {
        await runOverride(overrideDir, this.resourceTemplateObj, projectInfo);
      } catch (err: $TSAny) {
        throw new AmplifyError(
          'InvalidOverrideError',
          {
            message: `Executing overrides failed.`,
            details: err.message,
            resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
          },
          err,
        );
      }
    }
  };

  /**
   * save build files
   */
  saveBuildFiles = (commandType: CLISubCommandType): void => {
    if (this.resourceTemplateObj) {
      // Render CFN Template string and store as member in this.cfn
      this.cfn = this.resourceTemplateObj.renderCloudFormationTemplate();
    }
    // Store cloudformation-template.json, Parameters.json and Update BackendConfig
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
  };

  /**
   * generate stack for s3
   */
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

  /**
   * adds cfn outputs to stack
   */
  _addOutputs = (): void => {
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
  };

  /**
   * adds cfn parameters to stack
   */
  _addParameters = (): void => {
    const s3CfnParams: Array<AmplifyCfnParamType> = [
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

    s3CfnParams.map((params) => this._setCFNParams(params));
  };

  /**
   * Helper: Add CFN Resource Param definitions as CfnParameter
   */
  _setCFNParams = (paramDefinitions: AmplifyCfnParamType): void => {
    const { resourceTemplateObj } = this;
    if (resourceTemplateObj) {
      paramDefinitions.params.forEach((paramName) => {
        // set param type
        const cfnParam: $TSAny = {
          type: paramDefinitions.paramType,
        };
        // set param default if provided
        if (paramDefinitions.default) {
          cfnParam.default = paramDefinitions.default;
        }
        // configure param in resource template object
        resourceTemplateObj.addCfnParameter(cfnParam, paramName);
      });
    } // else throw an exception TBD
  };

  /**
   * Helper: Save files in local-filesystem
   */
  _saveFilesToLocalFileSystem = (fileName: string, data: $TSAny): void => {
    fs.ensureDirSync(this.cliInputsState.buildFilePath);
    const cfnFilePath = path.resolve(path.join(this.cliInputsState.buildFilePath, fileName));
    JSONUtilities.writeJson(cfnFilePath, data);
  };

  /**
   *  Helper: Save DependsOn entries to amplify-meta
   */
  _saveDependsOnToBackendConfig = (): void => {
    if (this.resourceTemplateObj) {
      // Get all collated resource dependencies
      const s3DependsOnResources = this.resourceTemplateObj.getS3DependsOn();
      const dependsOn = [...(s3DependsOnResources || [])];
      this.context.amplify.updateamplifyMetaAfterResourceUpdate(AmplifyCategories.STORAGE, this.resourceName, 'dependsOn', dependsOn);
    }
  };
}
