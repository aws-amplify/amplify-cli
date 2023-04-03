"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = void 0;
function listCategories(context) {
    const categoryPluginNames = Object.keys(context.amplify.getAllCategoryPluginInfo(context));
    return categoryPluginNames.join(', ');
}
exports.listCategories = listCategories;
//# sourceMappingURL=list-categories.js.map