/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable spellcheck/spell-checker */

import { $TSAny, $TSContext, exitOnNextTick, NotImplementedError } from 'amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * Add Analytics resource walkthrough
 * @param {*} context - CLI context
 * @param {*} __ - Analytics
 * @param {*} service - Pinpoint/Kinesis
 * @returns resourceName
 */
export const addResource = (context: $TSContext, __: string, service: string): $TSAny => {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata);
};

/**
 * Update Analytics Resource
 * @param context Amplify CLI context
 * @param __  should be one of kinesis or pinpoint
 * @param service Name of analytics provider service
 * @returns updateWalkthrough response
 */
export const updateResource = (context: $TSContext, __: string, service: string): $TSAny => {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const message = 'Update functionality not available for this service';
    printer.error(message);
    void context.usageData.emitError(new NotImplementedError(message));
    exitOnNextTick(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
};

/**
 * Get IAM permission policies
 * @param context amplify cli context
 * @param service provider service for analytics resource
 * @param resourceName name of the analytics resource
 * @param crudOptions access requirements ( Create-Read-Update-Delete )
 * @returns IAM policies
 */
export const getPermissionPolicies = (
  context: $TSContext,
  service: string,
  resourceName: string,
  crudOptions: $TSAny,
): $TSAny | undefined => {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);
  return getIAMPolicies(resourceName, crudOptions);
};
