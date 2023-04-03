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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageResource = void 0;
const fs = __importStar(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const path = __importStar(require("path"));
async function packageResource(request, context) {
    if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp || request.currentHash) {
        const resourcePath = request.service ? path.join(request.srcRoot, '..') : path.join(request.srcRoot, 'src');
        const packageHash = !request.skipHashing ? await context.amplify.hashDir(resourcePath, ['node_modules']) : undefined;
        const zipEntries = [];
        if (request.service) {
            const libGlob = glob_1.default.sync(resourcePath);
            const layerDirPath = path.join(request.srcRoot, '..', '..');
            const optPath = path.join(layerDirPath, 'opt');
            const conflicts = [];
            libGlob.forEach((lib) => {
                const basename = path.basename(lib);
                if (fs.pathExistsSync(path.join(optPath, basename))) {
                    conflicts.push(basename);
                }
            });
            if (conflicts.length > 0) {
                const libs = conflicts.map((lib) => `"/${lib}"`).join(', ');
                const plural = conflicts.length > 1 ? 'ies' : 'y';
                context.print.warning(`${libs} subdirector${plural} found in both "/lib" and "/opt". These folders will be merged and the files in "/opt" will take precedence if a conflict exists.`);
            }
            [...libGlob].forEach((folder) => {
                if (fs.lstatSync(folder).isDirectory()) {
                    zipEntries.push({
                        packageFolder: folder,
                    });
                }
            });
        }
        else {
            zipEntries.push({
                sourceFolder: resourcePath,
            });
        }
        return Promise.resolve({ packageHash, zipEntries });
    }
    return Promise.resolve({});
}
exports.packageResource = packageResource;
//# sourceMappingURL=legacyPackage.js.map