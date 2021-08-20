'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = exports.alias = exports.name = void 0;
const string_maps_1 = require('../../provider-utils/awscloudformation/assets/string-maps');
const getAuthResourceName_1 = require('../../utils/getAuthResourceName');
const __1 = require('../..');
const amplify_cli_core_1 = require('amplify-cli-core');
exports.name = 'update';
exports.alias = ['update'];
const run = async context => {
  const { amplify } = context;
  const servicesMetadata = (await Promise.resolve().then(() => __importStar(require('../../provider-utils/supported-services'))))
    .supportedServices;
  const existingAuth = amplify_cli_core_1.stateManager.getMeta().auth;
  if (!existingAuth) {
    return context.print.warning('Auth has not yet been added to this project.');
  } else {
    const services = Object.keys(existingAuth);
    for (const service of services) {
      const serviceMeta = existingAuth[service];
      if (serviceMeta.service === 'Cognito' && serviceMeta.mobileHubMigrated === true) {
        context.print.error('Auth is migrated from Mobile Hub and cannot be updated with Amplify CLI.');
        return context;
      } else if (serviceMeta.service === 'Cognito' && serviceMeta.serviceType === 'imported') {
        context.print.error('Updating of imported Auth resources is not supported.');
        return context;
      }
    }
  }
  context.print.info('Please note that certain attributes may not be overwritten if you choose to use defaults settings.');
  const meta = amplify_cli_core_1.stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
  });
  if (dependentResources) {
    context.print.info(string_maps_1.messages.dependenciesExists);
  }
  const resourceName = await getAuthResourceName_1.getAuthResourceName(context);
  const providerPlugin = context.amplify.getPluginInstance(context, servicesMetadata.Cognito.provider);
  context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);
  try {
    const result = await amplify.serviceSelectionPrompt(context, __1.category, servicesMetadata);
    const options = {
      service: result.service,
      providerPlugin: result.providerName,
      resourceName,
    };
    const providerController = await Promise.resolve().then(() =>
      __importStar(require(`../../provider-utils/${result.providerName}/index`)),
    );
    if (!providerController) {
      context.print.error('Provider not configured for this category');
      return;
    }
    const updateRsourceResponse = await providerController.updateResource(context, options);
    const { print } = context;
    print.success(`Successfully updated resource ${exports.name} locally`);
    print.info('');
    print.success('Some next steps:');
    print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
    print.info(
      '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
    );
    print.info('');
    return updateRsourceResponse;
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error adding the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
exports.run = run;
//# sourceMappingURL=update.js.map
