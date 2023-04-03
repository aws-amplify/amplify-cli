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
exports.AmplifyNodePkgDetector = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_error_1 = require("../errors/amplify-error");
const amplify_fault_1 = require("../errors/amplify-fault");
const packageManager_1 = require("../utils/packageManager");
const parser_factory_1 = require("./parser-factory");
class AmplifyNodePkgDetector {
    constructor(amplifyDetectorProps) {
        this.parsePkgJson = (projectRoot) => {
            const pkgJsonFullPath = path.resolve(projectRoot, 'package.json');
            return JSON.parse(fs.readFileSync(pkgJsonFullPath, 'utf-8'));
        };
        this.getLockFileContent = (projectRoot) => {
            const lockFileFullPath = path.join(projectRoot, this.packageManager.lockFile);
            if (!fs.existsSync(lockFileFullPath)) {
                throw new amplify_fault_1.AmplifyFault('LockFileNotFoundFault', {
                    message: `Lockfile not found at location: ${lockFileFullPath}`,
                });
            }
            return fs.readFileSync(lockFileFullPath, 'utf-8');
        };
        this.detectAffectedDirectDependencies = (dependencyToSearch) => {
            let explicitDependencies = new Array();
            const allPkgJsonDependencies = Object.assign(this.pkgJsonObj.dependencies, this.pkgJsonObj.peerDependencies);
            const allPackagesWithDependency = this.lockFileParser.getDependentPackageMap(dependencyToSearch, this.lockFileContents);
            if (allPackagesWithDependency !== undefined) {
                explicitDependencies = Object.keys(allPackagesWithDependency)
                    .map((pkg) => {
                    if (allPkgJsonDependencies[pkg]) {
                        const obj = {
                            packageName: pkg,
                            dependentPackage: {
                                name: dependencyToSearch,
                                version: allPackagesWithDependency[pkg][dependencyToSearch].version,
                            },
                        };
                        return obj;
                    }
                    return {};
                })
                    .filter((value) => Object.keys(value).length !== 0);
            }
            return explicitDependencies;
        };
        const packageManager = (0, packageManager_1.getPackageManager)(amplifyDetectorProps.projectRoot);
        if (packageManager === null) {
            throw new amplify_error_1.AmplifyError('MissingOverridesInstallationRequirementsError', {
                message: 'No package manager found.',
                resolution: 'Install npm or yarn to compile overrides for this project.',
            });
        }
        this.packageManager = packageManager;
        this.pkgJsonObj = this.parsePkgJson(amplifyDetectorProps.projectRoot);
        this.lockFileContents = this.getLockFileContent(amplifyDetectorProps.projectRoot);
        this.lockFileParser = parser_factory_1.LockFileParserFactory.getLockFileParser(this.packageManager.packageManager);
    }
}
exports.AmplifyNodePkgDetector = AmplifyNodePkgDetector;
//# sourceMappingURL=amplify-nodejs-detector.js.map