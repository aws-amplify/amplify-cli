"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSyncPipelineResolver = void 0;
const base_resolver_1 = require("./base-resolver");
class AppSyncPipelineResolver extends base_resolver_1.AppSyncBaseResolver {
    constructor(config, simulatorContext) {
        super(config, simulatorContext);
        this.config = config;
        try {
            config.functions.map((fn) => simulatorContext.getFunction(fn));
        }
        catch (e) {
            throw new Error(`Invalid config for PIPELINE_RESOLVER ${JSON.stringify(config)}`);
        }
        const { fieldName, typeName } = config;
        if (!fieldName || !typeName) {
            throw new Error(`Invalid config for PIPELINE_RESOLVER.FieldName or typeName is missing.\n ${JSON.stringify(config)}`);
        }
        this.config = config;
    }
    async resolve(source, args, context, info) {
        const requestMappingTemplate = this.getRequestMappingTemplate();
        const responseMappingTemplate = this.getResponseMappingTemplate();
        let result = {};
        let stash = {};
        let templateErrors;
        let isReturn;
        let hadException;
        ({
            result,
            stash,
            errors: templateErrors,
            isReturn,
            hadException,
            args,
        } = requestMappingTemplate.render({ source, arguments: args, stash }, context, info));
        context.appsyncErrors = [...context.appsyncErrors, ...(templateErrors || [])];
        if (isReturn || hadException) {
            return result;
        }
        let prevResult = result;
        for (const fnName of this.config.functions) {
            const fnResolver = this.simulatorContext.getFunction(fnName);
            ({ result: prevResult, stash, hadException, args } = await fnResolver.resolve(source, args, stash, prevResult, context, info));
            if (hadException) {
                return prevResult;
            }
        }
        ({ result, errors: templateErrors } = responseMappingTemplate.render({ source, arguments: args, result: prevResult, prevResult, stash }, context, info));
        context.appsyncErrors = [...context.appsyncErrors, ...(templateErrors || [])];
        return result;
    }
}
exports.AppSyncPipelineResolver = AppSyncPipelineResolver;
//# sourceMappingURL=pipeline-resolver.js.map