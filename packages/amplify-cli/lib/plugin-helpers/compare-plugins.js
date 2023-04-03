"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoPluginsAreTheSame = void 0;
function twoPluginsAreTheSame(plugin0, plugin1) {
    if (plugin0.packageLocation === plugin1.packageLocation) {
        return true;
    }
    if (plugin0.packageName === plugin1.packageName && plugin0.packageVersion === plugin1.packageVersion) {
        return true;
    }
    return false;
}
exports.twoPluginsAreTheSame = twoPluginsAreTheSame;
//# sourceMappingURL=compare-plugins.js.map