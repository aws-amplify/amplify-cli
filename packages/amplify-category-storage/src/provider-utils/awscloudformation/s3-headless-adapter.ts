import { $TSAny, $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { AddS3ServiceConfiguration, AddStorageRequest, CrudOperation, PermissionGroups, S3Permissions, UpdateStorageRequest } from 'amplify-headless-interface';
import { s3GetUserInput, S3UserInputs } from '../..';
import { getAllDefaults as getDefaultS3UserInput } from './default-values/s3-defaults';
import { GroupAccessType, S3AccessType, S3PermissionType, S3TriggerEventType, S3TriggerPrefixTransform, S3UserInputTriggerFunctionParams } from './service-walkthrough-types/s3-user-input-types';
import { v4 as uuid } from 'uuid';
/**
 * Configure S3UserInputs for all parameters except for (new) lambda triggers.
 * @param storageRequest : Headless storage request
 * @returns s3UserInput
 */
export function buildS3UserInputFromHeadlessStorageRequest(context: $TSContext, storageRequest: AddStorageRequest): S3UserInputs {
  const headlessS3Config: AddS3ServiceConfiguration = storageRequest.serviceConfiguration;
  const headlessS3Permissions: S3Permissions = storageRequest.serviceConfiguration.permissions;
  const authPermissions: S3PermissionType[] = getS3PermissionFromHeadlessParams(headlessS3Permissions.auth);
  const guestPermissions: S3PermissionType[] = getS3PermissionFromHeadlessParams(headlessS3Permissions.guest);
  const storageAccess: S3AccessType = getStorageAccessTypeFromPermissions(guestPermissions);
  const groupAccess: GroupAccessType | undefined = getGroupAccessTypeFromPermissions(headlessS3Permissions.groups);
  const [shortId] = uuid().split('-');
  const defaultS3UserInput = getDefaultS3UserInput(context.amplify.getProjectDetails(), shortId);

  let s3UserInput: S3UserInputs = {
    resourceName: headlessS3Config.resourceName ? headlessS3Config.resourceName : defaultS3UserInput.resourceName,
    bucketName: headlessS3Config.bucketName ? headlessS3Config.bucketName : defaultS3UserInput.bucketName,
    policyUUID: defaultS3UserInput.policyUUID,
    storageAccess: storageAccess,
    guestAccess: guestPermissions,
    authAccess: authPermissions,
    groupAccess: groupAccess,
  };
  if (headlessS3Config.lambdaTrigger?.mode === 'existing') {
    s3UserInput.triggerFunction = headlessS3Config.lambdaTrigger.name;
  }
  //note:- if mode is new, we will create the trigger function using a different api.
  return s3UserInput;
}

/**
 * Update S3UserInputs for all parameters except for (new) lambda triggers.
 * @param storageRequest : Headless storage request
 * @returns s3UserInput
 */
export async function buildS3UserInputFromHeadlessUpdateStorageRequest( context : $TSContext , storageRequest : UpdateStorageRequest ) : Promise<S3UserInputs>{
    const {
        serviceModification: { permissions, resourceName, lambdaTrigger },
      } = storageRequest;
    let s3UserInputs = await s3GetUserInput(context, resourceName)
    //update permissions
    if( permissions ){
        s3UserInputs.authAccess = getS3PermissionFromHeadlessParams(permissions.auth);
        s3UserInputs.guestAccess = getS3PermissionFromHeadlessParams(permissions.guest);
        s3UserInputs.storageAccess = getStorageAccessTypeFromPermissions(s3UserInputs.guestAccess);
    }
    //update trigger if existing, else first create function and then add
    if ( lambdaTrigger ){
        if (lambdaTrigger.mode === 'existing'){
            s3UserInputs.triggerFunction = lambdaTrigger.name;
        }
        //note:- if mode is new, we will create the trigger function using a different api.
    }
    return s3UserInputs;
}

/**
 * Build the default parameters required to generate a lambda trigger for S3.
 * Amplify storage lambda triggers when objects are created, updated or removed from :
 * /protected/${region}, /private/${region} and /public/${region} folders
 * where ${region} is the region in which the lambda is deployed e.g us-west-2
 * @param triggerFunctionName
 * @returns S3 trigger function params.
 */
export function buildTriggerFunctionParams(triggerFunctionName:string): S3UserInputTriggerFunctionParams{
   const storageLambdaParams: S3UserInputTriggerFunctionParams = {
        category : AmplifyCategories.STORAGE,
        tag : "triggerFunction",
        triggerFunction : triggerFunctionName,
        permissions : [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
        triggerEvents : [S3TriggerEventType.OBJ_PUT_POST_COPY, S3TriggerEventType.OBJ_REMOVED],
        triggerPrefix : [ { prefix : 'protected/', prefixTransform :  S3TriggerPrefixTransform.ATTACH_REGION },
                          { prefix : 'private/', prefixTransform :  S3TriggerPrefixTransform.ATTACH_REGION },
                          { prefix : 'public/', prefixTransform :  S3TriggerPrefixTransform.ATTACH_REGION } ]
      }
    return storageLambdaParams;
}


/** Data Type Conversion Helpers (Headless => UserInput) **/

export function getS3PermissionFromHeadlessParams(headlessPermissionList: CrudOperation[] | undefined): S3PermissionType[] {
  if (headlessPermissionList && headlessPermissionList.length > 0) {
    return headlessPermissionList.map(headlessCrud => {
      switch (headlessCrud) {
        case CrudOperation.CREATE_AND_UPDATE: {
          return S3PermissionType.CREATE_AND_UPDATE;
        }
        case CrudOperation.DELETE: {
          return S3PermissionType.DELETE;
        }
        case CrudOperation.READ: {
          return S3PermissionType.READ;
        }
        default:
          throw new Error(`Headless Acces Permission ${headlessCrud} is not supported in S3 CLI`);
      }
    });
  } else {
    return [];
  }
}
function getStorageAccessTypeFromPermissions(guestPermissions: S3PermissionType[]) {
  return guestPermissions && guestPermissions.length > 0 ? S3AccessType.AUTH_AND_GUEST : S3AccessType.AUTH_ONLY;
}

function getGroupAccessTypeFromPermissions(headlessPermissionGroups: PermissionGroups | undefined) {
  let groupAccessType: GroupAccessType = {};
  if (!headlessPermissionGroups) {
    return undefined;
  } else {
    const groupNames = Object.keys(headlessPermissionGroups);
    for (const groupName of groupNames) {
      groupAccessType[groupName] = getS3PermissionFromHeadlessParams(headlessPermissionGroups[groupName]);
    }
  }
  return groupAccessType;
}

/** End Data Type conversion helpers **/
