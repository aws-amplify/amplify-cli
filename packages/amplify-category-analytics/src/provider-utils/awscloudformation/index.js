/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
import { NotImplementedError, exitOnNextTick } from 'amplify-cli-core';

/**
 * Add Analytics resource walkthrough
 * @param {*} context - CLI constext
 * @param {*} category - Analytics
 * @param {*} service - Pinpoint/Kinesis
 * @returns resourceName
 */
export function addResource(context, category, service) {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);
  return addWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

/**
 *
 */
function updateResource(context, category, service) {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const message = 'Update functionality not available for this service';
    context.print.error(message);
    context.usageData.emitError(new NotImplementedError(message));
    exitOnNextTick(0);
  }
  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

/**
 *
 */
function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}

module.exports = { addResource, getPermissionPolicies, updateResource };
