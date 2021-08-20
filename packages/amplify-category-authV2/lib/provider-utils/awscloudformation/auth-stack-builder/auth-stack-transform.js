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
exports.AmplifyAuthTransform = exports.authCognitoStackFileName = exports.CommandType = void 0;
const amplify_cli_core_1 = require('amplify-cli-core');
const auth_cognito_stack_builder_1 = require('./auth-cognito-stack-builder');
const stack_synthesizer_1 = require('./stack-synthesizer');
const cdk = __importStar(require('@aws-cdk/core'));
const auth_input_state_1 = require('../auth-inputs-manager/auth-input-state');
const generate_auth_trigger_template_1 = require('../utils/generate-auth-trigger-template');
const constants_1 = require('../constants');
var CommandType;
(function (CommandType) {
  CommandType[(CommandType['ADD'] = 0)] = 'ADD';
  CommandType[(CommandType['UPDATE'] = 1)] = 'UPDATE';
  CommandType[(CommandType['REMOVE'] = 2)] = 'REMOVE';
})((CommandType = exports.CommandType || (exports.CommandType = {})));
exports.authCognitoStackFileName = 'auth-template.yml';
class AmplifyAuthTransform {
  constructor(options, command) {
    this.applyOverride = async () => {
      if (this._command === CommandType.ADD || this._command === CommandType.UPDATE) {
        const { overrideProps } = await Promise.resolve().then(() => __importStar(require(this._overrideProps.overrideFnPath)));
        if (typeof overrideProps === 'function' && overrideProps) {
          this._authTemplateObj = overrideProps(this._authTemplateObj);
        } else {
          console.log('There is no override setup yet for Root Stack. To enable override : Run amplify override root');
        }
      }
    };
    this.getInput = async () => {
      return {
        authStackFileName: this._resourceConfig.stackFileName,
        authStackInputPayload: this._authInputState.getCliInputPayload(),
        event: CommandType.ADD,
      };
    };
    this.synthesizeTemplates = async () => {
      var _a;
      (_a = this.app) === null || _a === void 0 ? void 0 : _a.synth();
      const templates = this._synthesizer.collectStacks();
      return templates.get('AmplifyAuthCognitoStack');
    };
    this.deployOverrideStacksToDisk = async props => {
      if (this._authStackOptions.event === CommandType.ADD || this._authStackOptions.event === CommandType.UPDATE) {
        amplify_cli_core_1.JSONUtilities.writeJson(props.rootFilePath, props.templateStack);
      }
    };
    this._resourceConfig = options.resourceConfig;
    this._command = command;
    this._synthesizer = new stack_synthesizer_1.AuthStackSythesizer();
    this.app = new cdk.App();
    this._deploymentOptions = options.deploymentOptions;
    this._overrideProps = options.overrideOptions;
    this._cfnModifiers = options.cfnModifiers;
    this._authInputState = auth_input_state_1.AuthInputState.getInstance({
      category: this._resourceConfig.categoryName,
      resourceName: this._resourceConfig.resourceName,
      fileName: this._resourceConfig.stackFileName,
    });
  }
  async transform() {
    this._authStackOptions = await this.getInput();
    await this.generateResources();
    await this.applyOverride();
    const template = await this.synthesizeTemplates();
    if (this._cfnModifiers) {
      this._cfnModifiers(template);
    }
    if (this._command === CommandType.ADD || this._command === CommandType.UPDATE) {
      await this.deployOverrideStacksToDisk({
        templateStack: template,
        rootFilePath: this._deploymentOptions.rootFilePath,
      });
    }
    return template;
  }
  generateResources() {
    var _a, _b, _c;
    this._authTemplateObj = new auth_cognito_stack_builder_1.AmplifyAuthCognitoStack(this.app, 'AmplifyAuthCongitoStack', {
      synthesizer: this._synthesizer,
    });
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'env',
    );
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'authRoleArn',
    );
    this._authTemplateObj.addCfnParameter(
      {
        type: 'String',
      },
      'unauthRoleArn',
    );
    if ((_a = this._authInputState._authInputPayload) === null || _a === void 0 ? void 0 : _a.triggers) {
      generate_auth_trigger_template_1.generateNestedAuthTriggerTemplate(constants_1.category, this._authInputState._authInputPayload);
    }
    if ((_b = this._authInputState._authInputPayload) === null || _b === void 0 ? void 0 : _b.userPoolGroupList) {
    }
    if ((_c = this._authInputState._authInputPayload) === null || _c === void 0 ? void 0 : _c.adminQueries) {
    }
  }
}
exports.AmplifyAuthTransform = AmplifyAuthTransform;
//# sourceMappingURL=auth-stack-transform.js.map
