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
exports.YarnLockParser = void 0;
const yarnLockfileParser = __importStar(require("@yarnpkg/lockfile"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_fault_1 = require("../errors/amplify-fault");
const lock_file_types_1 = require("./lock-file-types");
class YarnLockParser {
    constructor() {
        this.parseLockFile = (lockFileContents) => {
            try {
                const yarnLock = {
                    lockfileType: this.type,
                    lockfileVersion: 1,
                    ...yarnLockfileParser.parse(lockFileContents),
                };
                yarnLock.dependencies = yarnLock.object;
                return yarnLock;
            }
            catch (e) {
                throw new amplify_fault_1.AmplifyFault('LockFileParsingFault', {
                    message: `yarn.lock parsing failed with an error: ${e.message}`,
                }, e);
            }
        };
        this.getDependencyKey = (packageName, version) => `${packageName}@${version}`;
        this.type = lock_file_types_1.LockfileType.YARN;
        this.dependenciesMap = {};
    }
    getDependentPackageMap(packageName, lockFileContents) {
        const lockFileDependenciesMap = this.parseLockFile(lockFileContents);
        if (lockFileDependenciesMap.dependencies) {
            for (const dependency of Object.keys(lockFileDependenciesMap.dependencies)) {
                const dependencyPkgKey = dependency.substring(0, dependency.lastIndexOf('@'));
                if (lodash_1.default.isEmpty(this.dependenciesMap[dependency])) {
                    if (dependencyPkgKey === packageName) {
                        this.dependenciesMap[packageName] = {};
                        this.dependenciesMap[packageName][dependencyPkgKey] = lockFileDependenciesMap.dependencies[dependency];
                    }
                    this.dfs(dependency, lockFileDependenciesMap, packageName, new Set());
                }
            }
        }
        return this.dependenciesMap;
    }
    dfs(dependency, lockFileDependenciesMap, dependencyToSearch, visited) {
        var _a, _b, _c, _d, _e;
        if (visited.has(dependency)) {
            return;
        }
        visited.add(dependency);
        if (lockFileDependenciesMap.dependencies) {
            const dependencyPkgKey = dependency.substring(0, dependency.lastIndexOf('@'));
            const dependencyObj = lockFileDependenciesMap.dependencies[dependency];
            if (dependencyObj !== undefined && dependencyObj.dependencies !== undefined) {
                const dependencyObjDeps = dependencyObj.dependencies;
                for (const nestedDependency of Object.keys(dependencyObjDeps)) {
                    const nestedDependencyActual = this.getDependencyKey(nestedDependency, `${dependencyObjDeps[nestedDependency]}`);
                    if (nestedDependency === dependencyToSearch || !lodash_1.default.isEmpty((_b = (_a = this.dependenciesMap) === null || _a === void 0 ? void 0 : _a[nestedDependency]) === null || _b === void 0 ? void 0 : _b[dependencyToSearch])) {
                        this.dependenciesMap[dependencyPkgKey] = {};
                        this.dependenciesMap[dependencyPkgKey][dependencyToSearch] =
                            (_e = (_d = (_c = this.dependenciesMap) === null || _c === void 0 ? void 0 : _c[nestedDependency]) === null || _d === void 0 ? void 0 : _d[dependencyToSearch]) !== null && _e !== void 0 ? _e : lockFileDependenciesMap.dependencies[nestedDependencyActual];
                        return;
                    }
                    if (lodash_1.default.isEmpty(this.dependenciesMap[nestedDependency])) {
                        this.dfs(nestedDependencyActual, lockFileDependenciesMap, dependencyToSearch, visited);
                    }
                }
            }
        }
    }
}
exports.YarnLockParser = YarnLockParser;
//# sourceMappingURL=yarn-lock-parser.js.map