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
exports.run = exports.alias = exports.category = exports.name = void 0;
const project_has_auth_1 = require('../../provider-utils/awscloudformation/utils/project-has-auth');
exports.name = 'enable';
exports.category = 'auth';
exports.alias = ['add'];
const run = async context => {
  if (project_has_auth_1.projectHasAuth(context)) {
    return;
  }
  const { amplify } = context;
  const servicesMetadata = (await Promise.resolve().then(() => __importStar(require('../../provider-utils/supported-services'))))
    .supportedServices;
  const serviceSelectionPromptResult = await amplify.serviceSelectionPrompt(context, exports.category, servicesMetadata);
  const providerController = await Promise.resolve().then(() =>
    __importStar(require(`../../provider-utils/${serviceSelectionPromptResult.providerName}/index`)),
  );
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.addResource(context, serviceSelectionPromptResult.service);
};
exports.run = run;
//# sourceMappingURL=enable.js.map
