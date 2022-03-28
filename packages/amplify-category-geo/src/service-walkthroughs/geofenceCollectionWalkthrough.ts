import _ from 'lodash';
import { v4 as uuid } from "uuid";
import { merge } from '../service-utils/resourceUtils';
import { GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
import { ServiceName } from '../service-utils/constants';
import { $TSContext } from 'amplify-cli-core';
import { getCurrentGeofenceCollectionParameters, crudPermissionsMap } from '../service-utils/geofenceCollectionUtils';
import { getGeoServiceMeta, updateDefaultResource, checkGeoResourceExists, getGeoResources } from '../service-utils/resourceUtils';
import { getServiceFriendlyName, defaultResourceQuestion } from './resourceWalkthrough';
import { AccessType } from '../service-utils/resourceParams';
import { printer, prompter, alphanumeric, byValues, and, minLength, maxLength } from 'amplify-prompts';

const geofencingServiceFriendlyName = getServiceFriendlyName(ServiceName.GeofenceCollection);
/**
 * Starting point for CLI walkthrough that creates a geofence collection resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the geofence collection Resource
 */
export const createGeofenceCollectionWalkthrough = async (
  context: $TSContext,
  parameters: Partial<GeofenceCollectionParameters>
): Promise<Partial<GeofenceCollectionParameters>> => {
  // get the geofence collection name
  parameters = merge(parameters, await geofenceCollectionNameWalkthrough(context));

  // get the access
  parameters = merge(parameters, await geofenceCollectionAccessWalkthrough(context, parameters));

  // ask if the geofence collection should be set as a default. Default to true if it's the only geofence collection
  const currentGeofenceCollectionResources = await getGeoServiceMeta(ServiceName.GeofenceCollection);
  if (currentGeofenceCollectionResources && Object.keys(currentGeofenceCollectionResources).length > 0) {
    parameters.isDefault = await prompter.yesOrNo(
        defaultResourceQuestion(ServiceName.GeofenceCollection),
        true
    );
  }
  else {
    parameters.isDefault = true;
  }

  return parameters;
};

export const geofenceCollectionNameWalkthrough = async (context: any): Promise<Pick<GeofenceCollectionParameters, 'name'>> => {
    let collectionName;
    while(!collectionName) {
        const [shortId] = uuid().split('-');
        const nameValidationErrMsg = 'Geofence Collection name can only use the following characters: a-z 0-9 and should have minimum 1 character and max of 95 characters';
        const validator = and([alphanumeric(), minLength(1), maxLength(95)], nameValidationErrMsg);
        const collectionNameInput = await prompter.input(
            'Provide a name for the Geofence Collection:',
            { validate: validator, initial: `geofenceCollection${shortId}` }
        );
        if (await checkGeoResourceExists(collectionNameInput)) {
            printer.info(`Geo resource ${collectionNameInput} already exists. Choose another name.`);
        }
        else { 
            collectionName = collectionNameInput 
        };
    }
    return { name: collectionName };
};

export const geofenceCollectionAccessWalkthrough = async (
    context: $TSContext,
    parameters: Partial<GeofenceCollectionParameters>
): Promise<Partial<GeofenceCollectionParameters>> => {
    parameters.accessType = AccessType.CognitoGroups;
    let userPoolGroupList = context.amplify.getUserPoolGroupList();

    if (userPoolGroupList.length <= 0) {
        if (await prompter.yesOrNo('Geofencing requires a Cognito user group for Admin only access control settings. Do you want to add it now?')) {
            printer.info('Select "Create or update Cognito user pool groups" to add a Cognito user group');
            const currentcommand = context.input['command'];
            context.input['command'] = 'update';
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'executeAmplifyCommand', [context]);
            userPoolGroupList = context.amplify.getUserPoolGroupList();
            context.input['command'] = currentcommand;
        } else {
            printer.error('No Cognito groups exist in the project. Please add a Cognito group using "amplify update auth" and selecting "Create or update Cognito user pool groups"');
            throw new Error('Failed to setup a Geofence Collection. Requires a Cognito group for Admin only access control settings');
        }
    }

    let defaultSelectedGroups: string[] = [];

    if (parameters.groupPermissions) {
      defaultSelectedGroups = Object.keys(parameters.groupPermissions);
    }

    // If there is only one user pool group, select it by default
    if (defaultSelectedGroups.length === 0 && userPoolGroupList.length === 1) {
        defaultSelectedGroups.push(userPoolGroupList[0]);
    }

    const selectedUserPoolGroups = await prompter.pick<'many', string>(
        'Select one or more cognito groups to give access:',
        userPoolGroupList,
        { returnSize: 'many', initial: byValues(defaultSelectedGroups), pickAtLeast: 1 }
    );

    const groupCrudPermissionsFlow = async (group: string, defaults: string[] = []) => {
        const selectedCrudPermissions = await prompter.pick<'many', string>(
            `What kind of access do you want for ${group} users? Select ALL that apply:`,
            Object.keys(crudPermissionsMap),
            { returnSize: 'many', initial: byValues(defaults) }
        );

        return selectedCrudPermissions;
    };

    const selectedGroupPermissions: Record<string, string[]> = {};

    for (const selectedUserPoolGroup of selectedUserPoolGroups) {
        const defaults = parameters?.groupPermissions?.[selectedUserPoolGroup] || [];

        const selectedCrudPermissions = await groupCrudPermissionsFlow(selectedUserPoolGroup, defaults);

        selectedGroupPermissions[selectedUserPoolGroup] = selectedCrudPermissions;
    }

    parameters.groupPermissions = selectedGroupPermissions;
    return parameters;
};

/**
 * Starting point for CLI walkthrough that updates an existing geofence collection resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the geofence collection resource
 * @param resourceToUpdate Name of the geofence collection resource to update
 */
export const updateGeofenceCollectionWalkthrough = async (
    context: $TSContext,
    parameters: Partial<GeofenceCollectionParameters>,
    resourceToUpdate?: string
): Promise<Partial<GeofenceCollectionParameters>> => {
    const collectionResourceNames = await getGeoResources(ServiceName.GeofenceCollection);
    if (collectionResourceNames.length === 0) {
        printer.error(`No ${geofencingServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${geofencingServiceFriendlyName}.`);
        return parameters;
    }

    if (resourceToUpdate) {
        if (!collectionResourceNames.includes(resourceToUpdate)) {
            printer.error(`No ${geofencingServiceFriendlyName} named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await prompter.pick<'one', string>(`Select the ${geofencingServiceFriendlyName} to update`, collectionResourceNames);
    }

    parameters.name = resourceToUpdate;
    parameters = merge(parameters, await getCurrentGeofenceCollectionParameters(resourceToUpdate));

    // overwrite the parameters based on user input

    parameters.groupPermissions = (await geofenceCollectionAccessWalkthrough(context, parameters)).groupPermissions;

    const otherCollectionResources = collectionResourceNames.filter(collectionResourceName => collectionResourceName != resourceToUpdate);
    // if this is the only geofence collection, default cannot be removed
    if (otherCollectionResources.length > 0) {
        const isDefault = await prompter.yesOrNo(defaultResourceQuestion(ServiceName.GeofenceCollection), parameters.isDefault);
        // If a default geofence collection is updated, ask for new default
        if (parameters.isDefault && !isDefault) {
            await updateDefaultGeofenceCollectionWalkthrough(context, resourceToUpdate, otherCollectionResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true; // only geofence collection is always the default
    }
    return parameters;
};

/**
 * Walkthrough to choose a different default geofence collection
 * @param context The Amplify Context object
 * @param currentDefault The current default geofence collection name
 * @param availableGeofenceCollections The names of available geofence collections
 * @returns name of the new default geofence collection choosen
 */
export const updateDefaultGeofenceCollectionWalkthrough = async (
    context: $TSContext,
    currentDefault: string,
    availableGeofenceCollections?: string[]
): Promise<string> => {
    if (!availableGeofenceCollections) {
        availableGeofenceCollections = await getGeoResources(ServiceName.GeofenceCollection);
    }
    const otherCollectionResources = availableGeofenceCollections.filter(collectionResourceName => collectionResourceName !== currentDefault);
    if (otherCollectionResources?.length > 0) {
        const defaultIndexName = await prompter.pick(`Select the ${geofencingServiceFriendlyName} you want to set as default:`, otherCollectionResources);
        await updateDefaultResource(context, ServiceName.GeofenceCollection, defaultIndexName);
    }
    return currentDefault;
}
