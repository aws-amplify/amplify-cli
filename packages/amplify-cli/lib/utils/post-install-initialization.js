"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.postInstallInitialization = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const postInstallInitialization = async () => {
    await fs.remove(amplify_cli_core_1.pathManager.getAmplifyLibRoot());
    await fs.ensureDir(amplify_cli_core_1.pathManager.getAmplifyLibRoot());
    process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB = 'true';
    await Promise.all(copyPkgAssetRegistry.map(async (packageName) => {
        const { getPackageAssetPaths } = (await Promise.resolve().then(() => __importStar(require(packageName))));
        if (typeof getPackageAssetPaths !== 'function') {
            return;
        }
        const pluginArtifactPaths = await getPackageAssetPaths();
        if (!Array.isArray(pluginArtifactPaths)) {
            return;
        }
        await Promise.all(pluginArtifactPaths.map((assetPath) => {
            const resolvedPackageRoot = resolvePackageRoot(packageName);
            const targetLibFolder = amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(packageName);
            return fs.copy(path.join(resolvedPackageRoot, assetPath), path.join(targetLibFolder, assetPath));
        }));
    }));
    delete process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB;
};
exports.postInstallInitialization = postInstallInitialization;
const resolvePackageRoot = (packageName) => {
    const resolveDir = path.parse(require.resolve(packageName)).dir;
    const pathParts = resolveDir.split(path.sep);
    return pathParts.slice(0, pathParts.indexOf(packageName.replace(/^@.+\//, '')) + 1).join(path.sep);
};
const copyPkgAssetRegistry = [
    'amplify-dynamodb-simulator',
    'amplify-java-function-runtime-provider',
    '@aws-amplify/amplify-frontend-ios',
    'amplify-go-function-runtime-provider',
    '@aws-amplify/amplify-opensearch-simulator',
    'amplify-python-function-runtime-provider',
];
//# sourceMappingURL=post-install-initialization.js.map