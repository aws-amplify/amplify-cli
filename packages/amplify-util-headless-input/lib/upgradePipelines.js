"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUpgradePipeline = exports.noopUpgradePipeline = void 0;
const authVersionUpgrades_1 = require("./authVersionUpgrades");
const noopUpgradePipeline = () => [];
exports.noopUpgradePipeline = noopUpgradePipeline;
const authUpgradePipeline = (version) => {
    const minVersion = 1;
    const maxVersion = 2;
    if (version < minVersion || maxVersion < version) {
        throw new Error(`Headless auth upgrade pipeline encountered unknown schema version ${version}`);
    }
    const upgradePipeline = [authVersionUpgrades_1.v1toV2Upgrade];
    return upgradePipeline.slice(version - 1);
};
exports.authUpgradePipeline = authUpgradePipeline;
//# sourceMappingURL=upgradePipelines.js.map