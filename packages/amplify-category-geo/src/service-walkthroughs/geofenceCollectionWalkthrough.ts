import _ from 'lodash';
import { v4 as uuid } from "uuid";
import { merge } from '../service-utils/resourceUtils';
import { GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
import { ServiceName } from '../service-utils/constants';
import { $TSContext, $TSObject } from 'amplify-cli-core';
import { getCurrentGeofenceCollectionParameters, crudPermissionsMap } from '../service-utils/geofenceCollectionUtils';
import { getGeoServiceMeta, updateDefaultResource, geoServiceExists, getGeoPricingPlan, checkGeoResourceExists } from '../service-utils/resourceUtils';
import { pricingPlanWalkthrough, dataProviderWalkthrough, getServiceFriendlyName, defaultResourceQuestion } from './resourceWalkthrough';
import { AccessType, DataProvider, PricingPlan } from '../service-utils/resourceParams';
import { printer, prompter, alphanumeric, byValues } from 'amplify-prompts';

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

  // initiate pricing plan walkthrough if this is the first geofence collection added
  // or if the current pricing plan is RequestBasedUsage
  const currentPricingPlan = await getGeoPricingPlan();
  if (!(await geoServiceExists(ServiceName.GeofenceCollection)) || currentPricingPlan === PricingPlan.RequestBasedUsage) {
    parameters = merge(parameters, await geofenceCollectionPricingPlanWalkthrough(context, parameters));
  }
  else {
      // If the geofence collection is not the first and the pricing plan is set to something other than RequestBasedUsage
      // Then pricing plan can be set in Advanced settings
      printer.info('Available advanced settings:');
      printer.info(`- Pricing Plan (current: ${currentPricingPlan})`);
      printer.info(`- Data Provider for Pricing Plan (current: ${parameters.dataProvider ? parameters.dataProvider : 'Esri'})`);
      const showAdvancedSettings = await prompter.yesOrNo('Do you want to configure advanced settings?', false);
      if (showAdvancedSettings) {
        parameters = merge(parameters, await geofenceCollectionPricingPlanWalkthrough(context, parameters));
      }
  }

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

export const geofenceCollectionNameWalkthrough = async (context: any): Promise<Partial<GeofenceCollectionParameters>> => {
    let collectionName;
    while(!collectionName) {
        const [shortId] = uuid().split('-');
        const collectionNameInput = await prompter.input(
            'Provide a name for the Geofence Collection:',
            { validate: alphanumeric(), initial: `geofenceCollection${shortId}` }
        );
        if (await checkGeoResourceExists(collectionNameInput)) {
            printer.info(`Geo resource ${collectionNameInput} already exists. Choose another name.`);
        }
        else collectionName = collectionNameInput;
    }
    return { name: collectionName };
};

export const geofenceCollectionAccessWalkthrough = async (
    context: $TSContext,
    parameters: Partial<GeofenceCollectionParameters>
): Promise<Partial<GeofenceCollectionParameters>> => {
    parameters.accessType = AccessType.CognitoGroups;
    const userPoolGroupList = context.amplify.getUserPoolGroupList();
    if (userPoolGroupList.length <= 0) {
        printer.error('No Cognito groups exist in the project. Please add a Cognito group using "amplify update auth" and selecting "Create or update Cognito user pool groups"');
        throw new Error('Failed to setup a Geofence Collection. Requires a Cognito group for Admin only access control settings');
    }

    let defaultSelectedGroups: string[] = [];

    if (parameters.groupPermissions) {
      defaultSelectedGroups = Object.keys(parameters.groupPermissions);
    }

    const selectedUserPoolGroups = await prompter.pick<'many', string>(
        'Select one or more cognito groups to give access:',
        userPoolGroupList,
        { returnSize: 'many', initial: byValues(defaultSelectedGroups) }
    );

    let selectedUserPoolGroupsList: string[] = [];

    if(typeof selectedUserPoolGroups === 'string') {
        selectedUserPoolGroupsList = [selectedUserPoolGroups];
    }
    else {
        selectedUserPoolGroupsList = selectedUserPoolGroups;
    }

    const groupCrudPermissionsFlow = async (group: string, defaults: string[] = []) => {
        const possibleOperations = Object.keys(crudPermissionsMap).map(el => ({ name: el, value: el }));

        const selectedCrudPermissions = await prompter.pick<'many', string>(
            `What kind of access do you want for ${group} users? Select ALL that apply:`,
            possibleOperations,
            { returnSize: 'many', initial: byValues(defaults) }
        );

        return selectedCrudPermissions;
    };

    const selectedGroupPermissions: $TSObject = {};

    for (const selectedUserPoolGroup of selectedUserPoolGroupsList) {
        let defaults = [];

        if (parameters.groupPermissions) {
            defaults = parameters.groupPermissions[selectedUserPoolGroup] || [];
        }

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
    const collectionResources = ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === ServiceName.GeofenceCollection)

    if (collectionResources.length === 0) {
        printer.error(`No ${geofencingServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${geofencingServiceFriendlyName}.`);
        return parameters;
    }

    const collectionResourceNames = collectionResources.map(resource => resource.resourceName);

    if (resourceToUpdate) {
        if (!collectionResourceNames.includes(resourceToUpdate)) {
            printer.error(`No ${geofencingServiceFriendlyName} named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await prompter.pick<'one', string>(`Select the ${geofencingServiceFriendlyName} you want to update`, collectionResourceNames);
    }

    parameters.name = resourceToUpdate;
    parameters = merge(parameters, await getCurrentGeofenceCollectionParameters(resourceToUpdate));

    // overwrite the parameters based on user input

    parameters.groupPermissions = (await geofenceCollectionAccessWalkthrough(context, parameters)).groupPermissions;
    printer.info('Available advanced settings:');
    printer.info(`- Pricing Plan (current: ${parameters.pricingPlan})`);
    printer.info(`- Data Provider for Pricing Plan (current: ${parameters.dataProvider ? parameters.dataProvider : 'Esri'})`);
    const showAdvancedSettings = await prompter.yesOrNo('Do you want to update advanced settings?', false);
    if (showAdvancedSettings) {
        const pricingPlanSelections = await geofenceCollectionPricingPlanWalkthrough(context, parameters);
        parameters.pricingPlan = pricingPlanSelections.pricingPlan;
        parameters.dataProvider = pricingPlanSelections.dataProvider;
    }

    const otherCollectionResources = collectionResourceNames.filter(collectionResourceName => collectionResourceName != resourceToUpdate);
    // if this is the only geofence collection, default cannot be removed
    if (otherCollectionResources.length > 0) {
        const isDefault = await prompter.yesOrNo(defaultResourceQuestion(ServiceName.GeofenceCollection), true);
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
        availableGeofenceCollections = ((await context.amplify.getResourceStatus()).allResources as any[])
        .filter(resource => resource.service === ServiceName.GeofenceCollection)
        .map(resource => resource.resourceName);
    }
    const otherCollectionResources = availableGeofenceCollections.filter(collectionResourceName => collectionResourceName != currentDefault);
    if (otherCollectionResources?.length > 0) {
        const defaultIndexName = await prompter.pick(`Select the ${geofencingServiceFriendlyName} you want to set as default:`, otherCollectionResources);
        await updateDefaultResource(context, ServiceName.GeofenceCollection, defaultIndexName);
    }
    return currentDefault;
}

/**
 * Walkthrough to get the pricing plan and pricing plan data source for a Geofence Collection
 * @param context The Amplify Context object
 * @param parameters The configurations of the geofence collection resource
 */
export const geofenceCollectionPricingPlanWalkthrough = async (
    context: $TSContext,
    parameters: Partial<GeofenceCollectionParameters>
): Promise<Partial<GeofenceCollectionParameters>> => {
    parameters.pricingPlan = (await pricingPlanWalkthrough(context, parameters, true)).pricingPlan;
    if (parameters.pricingPlan !== PricingPlan.RequestBasedUsage) {
        parameters.dataProvider = (await dataProviderWalkthrough(parameters, ServiceName.GeofenceCollection)).dataProvider;
    }
    else {
        // set the default data provider
        parameters.dataProvider = DataProvider.Esri;
    }
    return parameters;
}
