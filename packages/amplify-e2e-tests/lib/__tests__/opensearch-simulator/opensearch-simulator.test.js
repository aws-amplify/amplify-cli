"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var openSearchEmulator = __importStar(require("@aws-amplify/amplify-opensearch-simulator"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = require("path");
var openpgp = __importStar(require("openpgp"));
var amplify_cli_core_1 = __importDefault(require("amplify-cli-core"));
var uuid_1 = require("uuid");
var execa_1 = __importDefault(require("execa"));
jest.mock('execa');
jest.setTimeout(90 * 1000);
var execaMock = execa_1.default;
execaMock.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, ({ stdout: 'mock-process-output' })];
}); }); });
jest.mock('amplify-cli-core', function () { return (__assign(__assign({}, jest.requireActual('amplify-cli-core')), { pathManager: {
        getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('mock-path-to-lib'),
    }, isWindowsPlatform: function () { return false; } })); });
describe('emulator operations', function () {
    var getMockSearchableFolder = function () {
        var pathToSearchableMockResources = '';
        do {
            pathToSearchableMockResources = (0, path_1.join)('/tmp', "amplify-cli-opensearch-emulator-".concat((0, uuid_1.v4)()), 'mock-api-resources', 'searchable');
        } while (fs_extra_1.default.existsSync(pathToSearchableMockResources));
        return pathToSearchableMockResources;
    };
    var pathToSearchableLocal = (0, path_1.join)('mock-path-to-lib', openSearchEmulator.relativePathToOpensearchLocal);
    var mockSearchableResourcePath = getMockSearchableFolder();
    var startupErrorMessage = 'Unable to start the Opensearch emulator. Please restart the mock process.';
    var pathToSearchableData = (0, path_1.join)(mockSearchableResourcePath, 'searchable-data');
    fs_extra_1.default.ensureDirSync(pathToSearchableData);
    var openSearchClusterOptions = {
        clusterName: 'mock-opensearch-cluster',
        nodeName: 'mock-opensearch-node-local',
        port: 9600,
        type: 'single-node',
        version: '1.3.0',
    };
    var openSearchClusterDefaultOptions = {
        clusterName: 'opensearch-cluster',
        nodeName: 'opensearch-node-local',
        port: 9200,
        type: 'single-node',
        version: '1.3.0',
    };
    var ensureMockSearchableResourcePath = function () {
        fs_extra_1.default.ensureDirSync(mockSearchableResourcePath);
        fs_extra_1.default.emptyDirSync(mockSearchableResourcePath);
    };
    var emulators;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ensureMockSearchableResourcePath();
            emulators = [];
            jest.setTimeout(5 * 60 * 1000);
            jest.resetModules();
            jest.spyOn(openpgp, 'verify').mockReturnValueOnce({
                signatures: [
                    {
                        verified: Promise.resolve(true),
                    },
                ],
            });
            return [2 /*return*/];
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all(emulators.map(function (emu) { return emu.terminate(); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ensureMockSearchableResourcePath();
            fs_extra_1.default.removeSync('mock-path-to-lib');
            return [2 /*return*/];
        });
    }); });
    it('should fail to launch on windows OS', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            jest.spyOn(amplify_cli_core_1.default, 'isWindowsPlatform').mockReturnValueOnce(true);
            expect(function () { return openSearchEmulator.launch(mockSearchableResourcePath); }).rejects.toThrow('Cannot launch OpenSearch simulator on windows OS');
            return [2 /*return*/];
        });
    }); });
    it('correctly resolves the path to local opensearch binary', function () { return __awaiter(void 0, void 0, void 0, function () {
        var relativePathFromMockSearchableResourceDir, fullPathToOpenSearchBinary;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openSearchEmulator.getPathToOpenSearchBinary()];
                case 1:
                    relativePathFromMockSearchableResourceDir = _a.sent();
                    expect(relativePathFromMockSearchableResourceDir).toEqual((0, path_1.join)('opensearchLib', 'bin', 'opensearch'));
                    return [4 /*yield*/, openSearchEmulator.getPathToOpenSearchBinary(mockSearchableResourcePath)];
                case 2:
                    fullPathToOpenSearchBinary = _a.sent();
                    expect(fullPathToOpenSearchBinary).toEqual((0, path_1.join)(mockSearchableResourcePath, 'opensearchLib', 'bin', 'opensearch'));
                    return [2 /*return*/];
            }
        });
    }); });
    it('skips downloading another opensearch binary when one is locally available', function () { return __awaiter(void 0, void 0, void 0, function () {
        var openSearchExists, nodeFetch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openSearchEmulator.openSearchLocalExists(mockSearchableResourcePath)];
                case 1:
                    openSearchExists = _a.sent();
                    // returns false when there is no local binary
                    expect(openSearchExists).toEqual(false);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('node-fetch')); })];
                case 2:
                    nodeFetch = _a.sent();
                    jest.mock('node-fetch', function () { return jest.fn(); });
                    expect(nodeFetch).toBeCalledTimes(0);
                    return [2 /*return*/];
            }
        });
    }); });
    it('correctly generates opensearch args from given options', function () { return __awaiter(void 0, void 0, void 0, function () {
        var resolvedBuildArgs, expectedCall;
        return __generator(this, function (_a) {
            resolvedBuildArgs = openSearchEmulator.buildArgs(openSearchClusterOptions, pathToSearchableData);
            expectedCall = "-Ecluster.name=".concat(openSearchClusterOptions.clusterName, " -Enode.name=").concat(openSearchClusterOptions.nodeName, " -Ehttp.port=").concat(openSearchClusterOptions.port, " -Ediscovery.type=").concat(openSearchClusterOptions.type, " -Epath.data=").concat(pathToSearchableData);
            expect(resolvedBuildArgs.join(' ')).toEqual(expectedCall);
            return [2 /*return*/];
        });
    }); });
    it('throws error if max re-tries is breached', function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, openSearchEmulator.launch(mockSearchableResourcePath, {}, 5)];
                case 1:
                    _a.sent();
                    fail('launching simulator is expected to throw but did not');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    expect(error_1.message).toEqual('Max retries hit for starting OpenSearch simulator');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    describe('ensureOpenSearchLocalExists', function () {
        it('should download opensearch binary and start the emulator', function () { return __awaiter(void 0, void 0, void 0, function () {
            var path, writeSpy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = (0, path_1.join)(process.cwd(), 'mock-path-to-emulator', 'opensearchLib', 'bin', 'opensearch');
                        writeSpy = jest.spyOn(openSearchEmulator, 'writeOpensearchEmulatorArtifacts').mockReturnValueOnce(Promise.resolve());
                        jest.spyOn(openSearchEmulator, 'startOpensearchEmulator').mockReturnValueOnce(Promise.resolve(undefined));
                        jest.spyOn(openSearchEmulator, 'getOpensearchLocalDirectory').mockReturnValueOnce(path);
                        return [4 /*yield*/, openSearchEmulator.ensureOpenSearchLocalExists((0, path_1.join)(process.cwd(), 'mock-path-to-emulator'))];
                    case 1:
                        _a.sent();
                        expect(writeSpy).toHaveBeenCalledTimes(1);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    it('should attempt setting up local instance of opensearch with default configuration', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.spyOn(openSearchEmulator, 'writeOpensearchEmulatorArtifacts').mockReturnValueOnce(Promise.resolve());
                    jest.spyOn(openSearchEmulator, 'startOpensearchEmulator').mockReturnValueOnce(Promise.resolve(undefined));
                    jest.spyOn(openSearchEmulator, 'ensureOpenSearchLocalExists').mockResolvedValue();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openSearchEmulator.launch(pathToSearchableData)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    expect(execaMock).toBeCalledWith('opensearchLib/bin/opensearch', [
                        "-Ecluster.name=".concat(openSearchClusterDefaultOptions.clusterName),
                        "-Enode.name=".concat(openSearchClusterDefaultOptions.nodeName),
                        "-Ehttp.port=".concat(openSearchClusterDefaultOptions.port),
                        "-Ediscovery.type=".concat(openSearchClusterDefaultOptions.type),
                        "-Epath.data=".concat(pathToSearchableData),
                    ], { cwd: pathToSearchableLocal });
                    expect(err_1 === null || err_1 === void 0 ? void 0 : err_1.message).toEqual(startupErrorMessage);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    it('should attempt setting up local instance of opensearch with custom configuration', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jest.spyOn(openSearchEmulator, 'writeOpensearchEmulatorArtifacts').mockReturnValueOnce(Promise.resolve());
                    jest.spyOn(openSearchEmulator, 'startOpensearchEmulator').mockReturnValueOnce(Promise.resolve(undefined));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openSearchEmulator.launch(pathToSearchableData, openSearchClusterOptions)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    expect(execaMock).toBeCalledWith('opensearchLib/bin/opensearch', [
                        "-Ecluster.name=".concat(openSearchClusterOptions.clusterName),
                        "-Enode.name=".concat(openSearchClusterOptions.nodeName),
                        "-Ehttp.port=".concat(openSearchClusterOptions.port),
                        "-Ediscovery.type=".concat(openSearchClusterDefaultOptions.type),
                        "-Epath.data=".concat(pathToSearchableData),
                    ], { cwd: pathToSearchableLocal });
                    expect(err_2 === null || err_2 === void 0 ? void 0 : err_2.message).toEqual(startupErrorMessage);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    it('should resolve to correct opensearch local binary path', function () { return __awaiter(void 0, void 0, void 0, function () {
        var resolvedDirectory;
        return __generator(this, function (_a) {
            resolvedDirectory = openSearchEmulator.getOpensearchLocalDirectory();
            expect(resolvedDirectory).toEqual(pathToSearchableLocal);
            return [2 /*return*/];
        });
    }); });
});
//# sourceMappingURL=opensearch-simulator.test.js.map