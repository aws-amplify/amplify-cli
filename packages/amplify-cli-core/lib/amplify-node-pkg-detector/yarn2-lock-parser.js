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
exports.Yarn2LockParser = void 0;
const lodash_1 = __importDefault(require("lodash"));
const yaml = __importStar(require("yaml"));
const amplify_fault_1 = require("../errors/amplify-fault");
const lock_file_types_1 = require("./lock-file-types");
const yarn_lock_parser_1 = require("./yarn-lock-parser");
class Yarn2LockParser extends yarn_lock_parser_1.YarnLockParser {
    constructor() {
        super();
        this.parseLockFile = (lockFileContents) => {
            try {
                const yarn2LockContent = yaml.parse(lockFileContents);
                delete yarn2LockContent.__metadata;
                const object = {};
                lodash_1.default.forEach(yarn2LockContent, (packageValue, packageKey) => {
                    const actualPackageKeys = this.convertToYarnParserKeys(packageKey);
                    actualPackageKeys.forEach((key) => {
                        object[key.trim()] = packageValue;
                    });
                });
                const yarnLock = {
                    object,
                    type: this.type,
                    lockfileVersion: 2,
                    lockfileType: lock_file_types_1.LockfileType.YARN2,
                };
                yarnLock.dependencies = yarnLock.object;
                return yarnLock;
            }
            catch (e) {
                throw new amplify_fault_1.AmplifyFault('LockFileParsingFault', {
                    message: `yarn.lock parsing failed`,
                }, e);
            }
        };
        this.convertToYarnParserKeys = (packageKey) => {
            if (packageKey.includes(',')) {
                return packageKey.split(',').map((key) => key.replace(/npm:/g, ''));
            }
            return [packageKey.replace(/npm:/g, '')];
        };
        this.type = lock_file_types_1.LockfileType.YARN2;
        this.dependenciesMap = {};
    }
}
exports.Yarn2LockParser = Yarn2LockParser;
//# sourceMappingURL=yarn2-lock-parser.js.map