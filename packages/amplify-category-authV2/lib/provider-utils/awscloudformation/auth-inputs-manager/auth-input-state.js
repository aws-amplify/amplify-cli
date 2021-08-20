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
exports.AuthInputState = exports.noopUpgradePipeline = void 0;
const amplify_cli_core_1 = require('amplify-cli-core');
const amplify_util_headless_input_1 = require('amplify-util-headless-input');
const fs = __importStar(require('fs-extra'));
const path = __importStar(require('path'));
const noopUpgradePipeline = () => [];
exports.noopUpgradePipeline = noopUpgradePipeline;
class AuthInputState {
  constructor(props) {
    var _a;
    this._category = props.category;
    this._filePath = props.fileName;
    this._resourceName = props.resourceName;
    try {
      this._authInputPayload =
        (_a = props.inputAuthPayload) !== null && _a !== void 0
          ? _a
          : amplify_cli_core_1.JSONUtilities.readJson(props.fileName, { throwIfNotExist: true });
    } catch (e) {
      throw new Error('migrate project with command : amplify migrate <to be decided>');
    }
    new amplify_util_headless_input_1.HeadlessInputValidator(authCliInputsSchemaSupplier, exports.noopUpgradePipeline).validate(
      JSON.stringify(this._authInputPayload),
    );
  }
  static getInstance(props) {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!AuthInputState.authInputState) {
      AuthInputState.authInputState = new AuthInputState(props);
    }
    return AuthInputState.authInputState;
  }
  getCliInputPayload() {
    if (this._authInputPayload) {
      return this._authInputPayload;
    } else {
      throw new Error('cli-inputs not present. Either add category or migrate project to support extensibility');
    }
  }
  saveCliInputPayload() {
    const backend = amplify_cli_core_1.pathManager.getBackendDirPath();
    fs.ensureDirSync(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this._resourceName));
    try {
      amplify_cli_core_1.JSONUtilities.writeJson(this._filePath, this._authInputPayload);
    } catch (e) {
      throw new Error(e);
    }
  }
}
exports.AuthInputState = AuthInputState;
const authCliInputsSchemaSupplier = version => {
  return getSchema('ServiceQuestionsResult', 'cognito', version);
};
const getSchema = async (type, service, version) => {
  try {
    return {
      rootSchema: await Promise.resolve().then(() =>
        __importStar(require(`amplify-category-auth/resources/schemas/${service}/${version}/${type}.schema.json`)),
      ),
    };
  } catch (ex) {
    return;
  }
};
//# sourceMappingURL=auth-input-state.js.map
