"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifySimulatorFunction = void 0;
const base_resolver_1 = require("./base-resolver");
class AmplifySimulatorFunction extends base_resolver_1.AppSyncBaseResolver {
    constructor(config, simulatorContext) {
        super(config, simulatorContext);
        this.config = config;
        const { dataSourceName } = config;
        if (!dataSourceName) {
            throw new Error(`Invalid configuration parameter for function ${JSON.stringify(config)}. Missing DataSource Name`);
        }
        const dataSource = simulatorContext.getDataLoader(dataSourceName);
        if (!dataSource) {
            throw new Error(`Missing data source ${dataSourceName}`);
        }
    }
    async resolve(source, args, stash, prevResult, context, info) {
        let result = null;
        let error = null;
        const requestMappingTemplate = this.getRequestMappingTemplate();
        const responseMappingTemplate = this.getResponseMappingTemplate();
        const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
        const requestTemplateResult = await requestMappingTemplate.render({ source, arguments: args, stash, prevResult }, context, info);
        context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateResult.errors];
        if (requestTemplateResult.isReturn || requestTemplateResult.hadException) {
            return {
                result: requestTemplateResult.result,
                stash: requestTemplateResult.stash,
                args: requestTemplateResult.args,
                hadException: requestTemplateResult.hadException,
            };
        }
        try {
            result = await dataLoader.load(requestTemplateResult.result);
        }
        catch (e) {
            error = e;
        }
        const responseMappingResult = await responseMappingTemplate.render({ source, arguments: args, result, stash: requestTemplateResult.stash, prevResult, error }, context, info);
        context.appsyncErrors = [...context.appsyncErrors, ...responseMappingResult.errors];
        return {
            stash: responseMappingResult.stash,
            result: responseMappingResult.result,
            hadException: responseMappingResult.hadException,
            args: requestTemplateResult.args,
        };
    }
}
exports.AmplifySimulatorFunction = AmplifySimulatorFunction;
//# sourceMappingURL=function.js.map