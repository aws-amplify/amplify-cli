"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLayerConfigFilesMigrated = exports.legacyUpdateOptData = exports.legacyAddOptData = exports.legacyAddLayer = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function legacyAddLayer(cwd, settings) {
    const defaultSettings = {
        permissions: [],
    };
    settings = Object.assign(Object.assign({}, defaultSettings), settings);
    return new Promise((resolve, reject) => {
        const chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(false), ['add', 'function'], { cwd, stripColors: true })
            .wait('Select which capability you want to add:')
            .sendKeyDown()
            .sendCarriageReturn() // Layer
            .wait('Provide a name for your Lambda layer:')
            .sendLine(settings.layerName);
        const runtimeDisplayNames = (0, amplify_e2e_core_1.getRuntimeDisplayNames)(settings.runtimes);
        expect(settings.runtimes.length === runtimeDisplayNames.length).toBe(true);
        chain.wait('Select up to 2 compatible runtimes:');
        (0, amplify_e2e_core_1.multiSelect)(chain, runtimeDisplayNames, amplify_e2e_core_1.layerRuntimeChoices);
        chain.wait('The current AWS account will always have access to this layer.');
        (0, amplify_e2e_core_1.multiSelect)(chain, settings.permissions, amplify_e2e_core_1.permissionChoices);
        if (settings.permissions.includes('Specific AWS accounts')) {
            chain.wait('Provide a list of comma-separated AWS account IDs:').sendLine(settings.accountId);
        }
        if (settings.permissions.includes('Specific AWS organization')) {
            chain.wait('Provide a list of comma-separated AWS organization IDs:').sendLine(settings.orgId);
        }
        if (settings.runtimes.length > 0) {
            chain.wait('Move your libraries to the following folder:');
        }
        chain.run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.legacyAddLayer = legacyAddLayer;
function legacyAddOptData(projRoot, layerName) {
    fs.writeFileSync(path.join(projRoot, 'amplify', 'backend', 'function', layerName, 'opt', 'data.txt'), 'data', 'utf8');
}
exports.legacyAddOptData = legacyAddOptData;
function legacyUpdateOptData(projRoot, layerName, data) {
    fs.writeFileSync(path.join(projRoot, 'amplify', 'backend', 'function', layerName, 'opt', 'data.txt'), data, 'utf8');
}
exports.legacyUpdateOptData = legacyUpdateOptData;
function validateLayerConfigFilesMigrated(projRoot, layerName) {
    const layerDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projRoot, 'function', layerName);
    return (fs.existsSync(path.join(layerDirPath, 'layer-configuration.json')) &&
        !fs.existsSync(path.join(layerDirPath, 'layer-runtimes.json')) &&
        !fs.existsSync(path.join(layerDirPath, 'layer-parameters.json')));
}
exports.validateLayerConfigFilesMigrated = validateLayerConfigFilesMigrated;
//# sourceMappingURL=legacy-lambda-layer.js.map