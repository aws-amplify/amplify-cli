"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrontendPlugins = void 0;
function getFrontendPlugins(context) {
    const frontendPlugins = {};
    context.runtime.plugins
        .filter((plugin) => plugin.pluginType === 'frontend')
        .map((plugin) => (frontendPlugins[plugin.pluginName] = plugin.directory));
    if (Object.keys(frontendPlugins).length === 0) {
        const errorMessage = `Can't find any frontend plugins configured for the CLI.`;
        context.print.error(errorMessage);
        context.print.info("Run 'amplify plugin scan' to scan your system for plugins.");
        const error = new Error(errorMessage);
        error.stack = undefined;
        throw error;
    }
    return frontendPlugins;
}
exports.getFrontendPlugins = getFrontendPlugins;
//# sourceMappingURL=get-frontend-plugins.js.map