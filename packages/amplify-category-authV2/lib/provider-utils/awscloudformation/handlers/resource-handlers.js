'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getUpdateAuthHandler = exports.getAddAuthHandler = void 0;
const auth_defaults_appliers_1 = require('../utils/auth-defaults-appliers');
const synthesize_resources_1 = require('../utils/synthesize-resources');
const amplify_meta_updaters_1 = require('../utils/amplify-meta-updaters');
const message_printer_1 = require('../utils/message-printer');
const supported_services_1 = require('../../supported-services');
const auth_sms_workflow_helper_1 = require('../utils/auth-sms-workflow-helper');
const auth_input_state_1 = require('../auth-inputs-manager/auth-input-state');
const amplify_cli_core_1 = require('amplify-cli-core');
const constants_1 = require('../constants');
const getAddAuthHandler = context => async request => {
  const serviceMetadata = supported_services_1.supportedServices[request.serviceName];
  const { cfnFilename, defaultValuesFilename, provider } = serviceMetadata;
  let projectName = context.amplify.getProjectConfig().projectName.toLowerCase();
  const disallowedChars = /[^A-Za-z0-9]+/g;
  projectName = projectName.replace(disallowedChars, '');
  const requestWithDefaults = await auth_defaults_appliers_1.getAddAuthDefaultsApplier(
    context,
    defaultValuesFilename,
    projectName,
  )(request);
  const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
  const cliInputsPath = amplify_cli_core_1.pathManager.getCliInputsPath(
    projectPath,
    constants_1.category,
    requestWithDefaults.resourceName,
  );
  const cliState = auth_input_state_1.AuthInputState.getInstance({
    category: constants_1.category,
    resourceName: requestWithDefaults.resourceName,
    fileName: cliInputsPath,
    inputAuthPayload: requestWithDefaults,
  });
  cliState.saveCliInputPayload();
  try {
    await synthesize_resources_1.getResourceSynthesizer(context, cfnFilename, provider)(requestWithDefaults);
    amplify_meta_updaters_1.getPostAddAuthMetaUpdater(context, { service: requestWithDefaults.serviceName, providerName: provider })(
      requestWithDefaults.resourceName,
    );
    message_printer_1.getPostAddAuthMessagePrinter(context.print)(requestWithDefaults.resourceName);
    if (auth_sms_workflow_helper_1.doesConfigurationIncludeSMS(request)) {
      await message_printer_1.printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return requestWithDefaults.resourceName;
};
exports.getAddAuthHandler = getAddAuthHandler;
const getUpdateAuthHandler = context => async request => {
  const { cfnFilename, defaultValuesFilename, provider } = supported_services_1.supportedServices[request.serviceName];
  const requestWithDefaults = await auth_defaults_appliers_1.getUpdateAuthDefaultsApplier(
    context,
    defaultValuesFilename,
    context.updatingAuth,
  )(request);
  try {
    await synthesize_resources_1.getResourceUpdater(context, cfnFilename, provider)(requestWithDefaults);
    await amplify_meta_updaters_1.getPostUpdateAuthMetaUpdater(context)(requestWithDefaults.resourceName);
    await message_printer_1.getPostUpdateAuthMessagePrinter(context.print)(requestWithDefaults.resourceName);
    if (auth_sms_workflow_helper_1.doesConfigurationIncludeSMS(requestWithDefaults)) {
      await message_printer_1.printSMSSandboxWarning(context.print);
    }
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error updating the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return requestWithDefaults.resourceName;
};
exports.getUpdateAuthHandler = getUpdateAuthHandler;
//# sourceMappingURL=resource-handlers.js.map
