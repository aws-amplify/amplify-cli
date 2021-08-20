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
exports.generateAuthStackTemplate = void 0;
const auth_stack_transform_1 = require('../auth-stack-builder/auth-stack-transform');
const path = __importStar(require('path'));
const amplify_cli_core_1 = require('amplify-cli-core');
const generateAuthStackTemplate = async (category, fileName, resourceName) => {
  try {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const cfnFilePath = path.join(
      amplify_cli_core_1.pathManager.getBackendDirPath(projectPath),
      category,
      resourceName,
      'build',
      auth_stack_transform_1.authCognitoStackFileName,
    );
    const overrideFnPath = path.join(
      amplify_cli_core_1.pathManager.getOverrideDirPath(projectPath, category, resourceName),
      'build',
      'override.js',
    );
    const overrideDir = amplify_cli_core_1.pathManager.getRootOverrideDirPath(projectPath);
    const props = {
      resourceConfig: {
        categoryName: category,
        resourceName,
        stackFileName: auth_stack_transform_1.authCognitoStackFileName,
      },
      deploymentOptions: {
        rootFilePath: cfnFilePath,
      },
      overrideOptions: {
        overrideFnPath,
        overrideDir,
      },
    };
    const authTransform = new auth_stack_transform_1.AmplifyAuthTransform(props, auth_stack_transform_1.CommandType.ADD);
    return await authTransform.transform();
  } catch (e) {
    throw new Error(e);
  }
};
exports.generateAuthStackTemplate = generateAuthStackTemplate;
//# sourceMappingURL=generate-auth-stack-template.js.map
