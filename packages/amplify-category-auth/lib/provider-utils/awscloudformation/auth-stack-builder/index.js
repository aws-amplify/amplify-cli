"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStackSynthesizer = exports.AmplifyUserPoolGroupTransform = exports.AmplifyUserPoolGroupStackOutputs = exports.AmplifyUserPoolGroupStack = exports.AmplifyAuthTransform = exports.AmplifyAuthCognitoStack = void 0;
var auth_cognito_stack_builder_1 = require("./auth-cognito-stack-builder");
Object.defineProperty(exports, "AmplifyAuthCognitoStack", { enumerable: true, get: function () { return auth_cognito_stack_builder_1.AmplifyAuthCognitoStack; } });
var auth_stack_transform_1 = require("./auth-stack-transform");
Object.defineProperty(exports, "AmplifyAuthTransform", { enumerable: true, get: function () { return auth_stack_transform_1.AmplifyAuthTransform; } });
var auth_user_pool_group_stack_builder_1 = require("./auth-user-pool-group-stack-builder");
Object.defineProperty(exports, "AmplifyUserPoolGroupStack", { enumerable: true, get: function () { return auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStack; } });
Object.defineProperty(exports, "AmplifyUserPoolGroupStackOutputs", { enumerable: true, get: function () { return auth_user_pool_group_stack_builder_1.AmplifyUserPoolGroupStackOutputs; } });
var user_pool_group_stack_transform_1 = require("./user-pool-group-stack-transform");
Object.defineProperty(exports, "AmplifyUserPoolGroupTransform", { enumerable: true, get: function () { return user_pool_group_stack_transform_1.AmplifyUserPoolGroupTransform; } });
var stack_synthesizer_1 = require("./stack-synthesizer");
Object.defineProperty(exports, "AuthStackSynthesizer", { enumerable: true, get: function () { return stack_synthesizer_1.AuthStackSynthesizer; } });
//# sourceMappingURL=index.js.map