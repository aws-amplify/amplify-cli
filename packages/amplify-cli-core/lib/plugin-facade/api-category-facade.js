"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCategoryFacade = void 0;
const API_CATEGORY_NAME = 'api';
class ApiCategoryFacade {
    static async getTransformerVersion(context) {
        return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'getTransformerVersion', [context]);
    }
    static async getDirectiveDefinitions(context, resourceDir) {
        return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'getDirectiveDefinitions', [context, resourceDir]);
    }
    static async transformGraphQLSchema(context, options) {
        return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'transformGraphQLSchema', [context, options]);
    }
}
exports.ApiCategoryFacade = ApiCategoryFacade;
//# sourceMappingURL=api-category-facade.js.map