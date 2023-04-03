"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VelocityTemplate = exports.VelocityTemplateParseError = void 0;
const type_definition_1 = require("../type-definition");
const amplify_velocity_template_1 = require("amplify-velocity-template");
const util_1 = require("./util");
const mapper_1 = require("./value-mapper/mapper");
const info_1 = require("./util/info");
class VelocityTemplateParseError extends Error {
}
exports.VelocityTemplateParseError = VelocityTemplateParseError;
class VelocityTemplate {
    constructor(template, simulatorContext) {
        var _a;
        this.simulatorContext = simulatorContext;
        try {
            const ast = (0, amplify_velocity_template_1.parse)(template.content.toString());
            this.compiler = new amplify_velocity_template_1.Compile(ast, {
                valueMapper: mapper_1.map,
                escape: false,
            });
            this.template = template;
        }
        catch (e) {
            const lineDetails = `${e.hash.line}:${((_a = e.hash.loc) === null || _a === void 0 ? void 0 : _a.first_column) ? e.hash.loc.first_column : ''}`;
            const fileName = template.path ? `${template.path}:${lineDetails}` : lineDetails;
            const templateError = new VelocityTemplateParseError(`Error:Parse error on ${fileName} \n${e.message}`);
            templateError.stack = e.stack;
            throw templateError;
        }
    }
    render(ctxValues, requestContext, info) {
        const context = this.buildRenderContext(ctxValues, requestContext, info);
        let templateResult;
        try {
            templateResult = this.compiler.render(context);
        }
        catch (e) {
            const lastError = context.util.errors.length && context.util.errors[context.util.errors.length - 1];
            if (lastError && lastError instanceof util_1.ValidateError) {
                return {
                    result: lastError.data,
                    errors: [...context.util.errors],
                    isReturn: true,
                    stash: context.ctx.stash.toJSON(),
                    args: context.ctx.args.toJSON(),
                    hadException: true,
                };
            }
            return {
                result: null,
                errors: [...context.util.errors],
                isReturn: false,
                stash: context.ctx.stash.toJSON(),
                args: context.ctx.args.toJSON(),
                hadException: true,
            };
        }
        const isReturn = this.compiler._state.return;
        const stash = context.ctx.stash.toJSON();
        const args = context.ctx.args.toJSON();
        try {
            const result = JSON.parse(templateResult);
            return { result, stash, args, errors: context.util.errors, isReturn, hadException: false };
        }
        catch (e) {
            if (isReturn) {
                return { result: templateResult, stash, args, errors: context.util.errors, isReturn, hadException: false };
            }
            const errorMessage = `Unable to convert ${templateResult} to class com.amazonaws.deepdish.transform.model.lambda.LambdaVersionedConfig.`;
            throw new util_1.TemplateSentError(errorMessage, 'MappingTemplate', null, null, info);
        }
    }
    buildRenderContext(ctxValues, requestContext, info) {
        var _a;
        const { source, arguments: argument, result, stash, prevResult, error } = ctxValues;
        const { jwt, sourceIp, iamToken } = requestContext;
        const { iss: issuer, sub, 'cognito:username': cognitoUserName, username } = jwt || {};
        const util = (0, util_1.create)([], new Date(Date.now()), info, requestContext);
        const args = (0, mapper_1.map)(argument);
        let identity = null;
        if (requestContext.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT) {
            identity = (0, mapper_1.map)({
                sub,
                issuer,
                sourceIp,
                claims: requestContext.jwt,
            });
        }
        else if (requestContext.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS) {
            identity = (0, mapper_1.map)({
                sub,
                issuer,
                sourceIp,
                'cognito:username': cognitoUserName,
                username: username || cognitoUserName,
                claims: requestContext.jwt,
                ...(this.simulatorContext.appSyncConfig.defaultAuthenticationType.authenticationType ===
                    type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS
                    ? { defaultAuthStrategy: 'ALLOW' }
                    : {}),
            });
        }
        else if (requestContext.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM) {
            identity = (0, mapper_1.map)({
                sourceIp,
                username: iamToken.username,
                userArn: iamToken.userArn,
                cognitoIdentityPoolId: iamToken === null || iamToken === void 0 ? void 0 : iamToken.cognitoIdentityPoolId,
                cognitoIdentityId: iamToken === null || iamToken === void 0 ? void 0 : iamToken.cognitoIdentityId,
                cognitoIdentityAuthType: iamToken === null || iamToken === void 0 ? void 0 : iamToken.cognitoIdentityAuthType,
                cognitoIdentityAuthProvider: iamToken === null || iamToken === void 0 ? void 0 : iamToken.cognitoIdentityAuthProvider,
            });
        }
        const vtlContext = {
            arguments: args,
            args,
            info: (0, mapper_1.map)((0, info_1.createInfo)(info)),
            request: { headers: requestContext.headers },
            identity,
            stash: (0, mapper_1.map)(stash || {}),
            source: (0, mapper_1.map)(source),
            result: (0, mapper_1.map)(result),
            error: error
                ? {
                    ...error,
                    type: error.type || ((_a = error.extensions) === null || _a === void 0 ? void 0 : _a.errorType) || 'UnknownErrorType',
                    message: error.message || `Error: ${error}`,
                }
                : error,
        };
        if (typeof prevResult !== 'undefined') {
            vtlContext['prev'] = (0, mapper_1.map)({
                result: prevResult,
            });
        }
        return {
            util,
            utils: util,
            context: vtlContext,
            ctx: vtlContext,
        };
    }
}
exports.VelocityTemplate = VelocityTemplate;
//# sourceMappingURL=index.js.map