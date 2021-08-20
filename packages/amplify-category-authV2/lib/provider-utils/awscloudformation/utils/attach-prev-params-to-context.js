'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.attachPrevParamsToContext = void 0;
const getAuthResourceName_1 = require('../../../utils/getAuthResourceName');
const supported_services_1 = require('../../supported-services');
const attachPrevParamsToContext = async context => {
  const resourceName = await getAuthResourceName_1.getAuthResourceName(context);
  const providerPlugin = context.amplify.getPluginInstance(context, supported_services_1.supportedServices.Cognito.provider);
  context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);
};
exports.attachPrevParamsToContext = attachPrevParamsToContext;
//# sourceMappingURL=attach-prev-params-to-context.js.map
