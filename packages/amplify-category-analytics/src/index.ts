/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { $TSAny, $TSContext } from 'amplify-cli-core';

/* eslint-disable spellcheck/spell-checker */
const path = require('path');
const inquirer = require('inquirer');
const pinpointHelper = require('./lib/pinpoint-helper');
const kinesisHelper = require('./lib/kinesis-helper');
const { migrate } = require('./provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough');

const category = 'analytics';
export * from './analytics-resource-api';

/**
 * Command to open AWS console for kinesis/pinpoint
 */
async function console(context: $TSContext) {
  const hasKinesisResource = kinesisHelper.hasResource(context);
  const hasPinpointResource = pinpointHelper.hasResource(context);

  let selectedResource;
  if (hasKinesisResource && hasPinpointResource) {
    const question = {
      name: 'resource',
      message: 'Select resource',
      type: 'list',
      choices: ['kinesis', 'pinpoint'],
      required: true,
    };

    const result = await inquirer.prompt(question);
    selectedResource = result.resource;
  } else if (hasKinesisResource) {
    selectedResource = 'kinesis';
  } else if (hasPinpointResource) {
    selectedResource = 'pinpoint';
  } else {
    context.print.error('Neither analytics nor notifications is enabled in the cloud.');
  }

  switch (selectedResource) {
    case 'kinesis':
      kinesisHelper.console(context);
      break;
    case 'pinpoint':
      pinpointHelper.console(context);
      break;
    default:
      break;
  }
}

/**
 * Get Permission policies
 */
async function getPermissionPolicies(context: $TSContext, resourceOpsMapping: { [x: string]: $TSAny; }) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies: $TSAny[] = [];
  const resourceAttributes: $TSAny[] = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerName = amplifyMeta[category][resourceName].providerPlugin;
      if (providerName) {
        const providerController = require(`./provider-utils/${providerName}/index`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category });
      } else {
        context.print.error(`Provider not configured for ${category}: ${resourceName}`);
      }
    } catch (e) {
      context.print.warning(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
  });
  return { permissionPolicies, resourceAttributes };
}

/**
 * Execute the Amplify CLI command
 * @param context - Amplify CLI context
 */
async function executeAmplifyCommand(context: $TSContext) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

/**
 *  Placeholder for Amplify events
 */
async function handleAmplifyEvent(context: $TSContext, args: $TSAny): Promise<void> {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  console,
  migrate,
  getPermissionPolicies,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
