"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageLockParser = void 0;
const lodash_1 = __importDefault(require("lodash"));
const amplify_fault_1 = require("../errors/amplify-fault");
const jsonUtilities_1 = require("../jsonUtilities");
const lock_file_types_1 = require("./lock-file-types");
class PackageLockParser {
    constructor() {
        this.parseLockFile = (lockFileContents) => {
            try {
                const packageLock = jsonUtilities_1.JSONUtilities.parse(lockFileContents);
                packageLock.type = lock_file_types_1.LockfileType.NPM;
                return packageLock;
            }
            catch (e) {
                throw new amplify_fault_1.AmplifyFault('LockFileParsingFault', {
                    message: `package-lock.json parsing failed with an error: ${e.message}`,
                }, e);
            }
        };
        this.getDependentPackageMap = (packageName, lockFileContents) => {
            const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
            if (lockFileDependenciesMap.dependencies) {
                for (const dependency of Object.keys(lockFileDependenciesMap.dependencies)) {
                    if (lodash_1.default.isEmpty(this.dependenciesMap[dependency])) {
                        if (dependency === packageName) {
                            this.dependenciesMap[packageName] = {};
                            this.dependenciesMap[dependency][packageName] = lockFileDependenciesMap.dependencies[dependency];
                        }
                        this.dfs(dependency, lockFileDependenciesMap, packageName, new Set());
                    }
                }
            }
            return this.dependenciesMap;
        };
        this.dfs = (dependency, lockFileDependenciesMap, dependencyToSearch, visited) => {
            var _a, _b;
            if (visited.has(dependency)) {
                return;
            }
            visited.add(dependency);
            if (lockFileDependenciesMap.dependencies !== undefined) {
                const dependencyObj = lockFileDependenciesMap.dependencies[dependency];
                if (dependencyObj !== undefined && dependencyObj.requires !== undefined) {
                    const dependencyObjDeps = dependencyObj.requires;
                    for (const nestedDependency of Object.keys(dependencyObjDeps)) {
                        if (nestedDependency === dependencyToSearch || !lodash_1.default.isEmpty((_a = this.dependenciesMap[nestedDependency]) === null || _a === void 0 ? void 0 : _a[dependencyToSearch])) {
                            const payload = lockFileDependenciesMap.dependencies[dependencyToSearch];
                            this.dependenciesMap[dependency] = {};
                            this.dependenciesMap[dependency][dependencyToSearch] = payload !== null && payload !== void 0 ? payload : this.dependenciesMap[nestedDependency][dependencyToSearch];
                            return;
                        }
                        if (lodash_1.default.isEmpty((_b = this.dependenciesMap[nestedDependency]) === null || _b === void 0 ? void 0 : _b[dependencyToSearch])) {
                            this.dfs(nestedDependency, lockFileDependenciesMap, dependencyToSearch, visited);
                        }
                    }
                }
            }
        };
        this.type = lock_file_types_1.LockfileType.NPM;
        this.dependenciesMap = {};
    }
}
exports.PackageLockParser = PackageLockParser;
//# sourceMappingURL=package-lock-parser.js.map