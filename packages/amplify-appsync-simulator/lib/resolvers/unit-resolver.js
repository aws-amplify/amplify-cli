"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncUnitResolver = void 0;
const base_resolver_1 = require("./base-resolver");
class AppSyncUnitResolver extends base_resolver_1.AppSyncBaseResolver {
    constructor(config, simulatorContext) {
        super(config, simulatorContext);
        try {
            simulatorContext.getDataLoader(config.dataSourceName);
        }
        catch (e) {
            throw new Error(`Invalid config for UNIT_RESOLVER ${JSON.stringify(config)} \n ${e.message}`);
        }
        const { fieldName, typeName } = config;
        if (!fieldName || !typeName) {
            throw new Error(`Invalid config for UNIT_RESOLVER ${JSON.stringify(config)}`);
        }
        this.config = config;
    }
    async resolve(source, args, context, info) {
        const requestMappingTemplate = this.getRequestMappingTemplate();
        const responseMappingTemplate = this.getResponseMappingTemplate();
        const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
        const { result: requestPayload, errors: requestTemplateErrors, isReturn, hadException, } = requestMappingTemplate.render({ source, arguments: args }, context, info);
        context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateErrors];
        let result = null;
        let error;
        if (isReturn || hadException) {
            return requestPayload;
        }
        try {
            result = await dataLoader.load(requestPayload, { source, args, context, info });
        }
        catch (e) {
            if (requestPayload && requestPayload.version === '2018-05-29') {
                error = e;
            }
            else {
                throw e;
            }
        }
        if (requestPayload && requestPayload.version !== '2018-05-29' && result === null) {
            return undefined;
        }
        const { result: responseTemplateResult, errors: responseTemplateErrors } = responseMappingTemplate.render({ source, arguments: args, result, error }, context, info);
        context.appsyncErrors = [...context.appsyncErrors, ...responseTemplateErrors];
        return responseTemplateResult;
    }
}
exports.AppSyncUnitResolver = AppSyncUnitResolver;
//# sourceMappingURL=unit-resolver.js.map