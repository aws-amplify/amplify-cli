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
exports.getPostUpdateAuthMetaUpdater = exports.getPostAddAuthMetaUpdater = void 0;
const path = __importStar(require('path'));
const amplify_cli_core_1 = require('amplify-cli-core');
const transform_user_pool_group_1 = require('./transform-user-pool-group');
const getPostAddAuthMetaUpdater = (context, resultMetadata) => resourceName => {
  const options = {
    service: resultMetadata.service,
    providerPlugin: resultMetadata.providerName,
  };
  const parametersJSONPath = path.join(context.amplify.pathManager.getBackendDirPath(), 'auth', resourceName, 'parameters.json');
  const authParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersJSONPath);
  if (authParameters.dependsOn) {
    options.dependsOn = authParameters.dependsOn;
  }
  let customAuthConfigured = false;
  if (authParameters.triggers) {
    const triggers = amplify_cli_core_1.JSONUtilities.parse(authParameters.triggers);
    customAuthConfigured =
      !!triggers.DefineAuthChallenge &&
      triggers.DefineAuthChallenge.length > 0 &&
      !!triggers.CreateAuthChallenge &&
      triggers.CreateAuthChallenge.length > 0 &&
      !!triggers.VerifyAuthChallengeResponse &&
      triggers.VerifyAuthChallengeResponse.length > 0;
  }
  options.customAuth = customAuthConfigured;
  context.amplify.updateamplifyMetaAfterResourceAdd('auth', resourceName, options);
  const allResources = context.amplify.getProjectMeta();
  if (allResources.auth && allResources.auth.userPoolGroups) {
    if (!authParameters.identityPoolName) {
      const userPoolGroupDependsOn = [
        {
          category: 'auth',
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID'],
        },
      ];
      context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
    }
  }
  return resourceName;
};
exports.getPostAddAuthMetaUpdater = getPostAddAuthMetaUpdater;
const getPostUpdateAuthMetaUpdater = context => async resourceName => {
  const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'auth', resourceName, 'parameters.json');
  const authParameters = amplify_cli_core_1.JSONUtilities.readJson(resourceDirPath);
  if (authParameters.dependsOn) {
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'dependsOn', authParameters.dependsOn);
  }
  let customAuthConfigured = false;
  if (authParameters.triggers) {
    const triggers = JSON.parse(authParameters.triggers);
    customAuthConfigured =
      !!triggers.DefineAuthChallenge &&
      triggers.DefineAuthChallenge.length > 0 &&
      !!triggers.CreateAuthChallenge &&
      triggers.CreateAuthChallenge.length > 0 &&
      !!triggers.VerifyAuthChallengeResponse &&
      triggers.VerifyAuthChallengeResponse.length > 0;
  }
  context.amplify.updateamplifyMetaAfterResourceUpdate('auth', resourceName, 'customAuth', customAuthConfigured);
  const allResources = context.amplify.getProjectMeta();
  if (allResources.auth && allResources.auth.userPoolGroups) {
    let attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
    if (authParameters.identityPoolName) {
      attributes.push('IdentityPoolId');
    }
    const userPoolGroupDependsOn = [
      {
        category: 'auth',
        resourceName,
        attributes,
      },
    ];
    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
    await transform_user_pool_group_1.transformUserPoolGroupSchema(context);
  }
  return resourceName;
};
exports.getPostUpdateAuthMetaUpdater = getPostUpdateAuthMetaUpdater;
//# sourceMappingURL=amplify-meta-updaters.js.map
