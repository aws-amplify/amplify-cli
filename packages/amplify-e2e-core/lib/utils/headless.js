"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHeadlessGeo = exports.addHeadlessGeo = exports.updateHeadlessStorage = exports.removeHeadlessStorage = exports.importHeadlessStorage = exports.addHeadlessStorage = exports.headlessAuthImport = exports.removeHeadlessAuth = exports.updateHeadlessAuth = exports.addHeadlessAuth = exports.removeHeadlessApi = exports.updateHeadlessApi = exports.addHeadlessApi = void 0;
const execa_1 = __importDefault(require("execa"));
const __1 = require("..");
const addHeadlessApi = (cwd, request, settings) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const allowDestructiveUpdates = (_a = settings === null || settings === void 0 ? void 0 : settings.allowDestructiveUpdates) !== null && _a !== void 0 ? _a : false;
    const testingWithLatestCodebase = (_b = settings === null || settings === void 0 ? void 0 : settings.testingWithLatestCodebase) !== null && _b !== void 0 ? _b : false;
    return executeHeadlessCommand(cwd, 'api', 'add', request, true, allowDestructiveUpdates, {
        testingWithLatestCodebase: testingWithLatestCodebase,
    });
});
exports.addHeadlessApi = addHeadlessApi;
const updateHeadlessApi = (cwd, request, allowDestructiveUpdates, settings = { testingWithLatestCodebase: false }) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'api', 'update', request, undefined, allowDestructiveUpdates, settings);
});
exports.updateHeadlessApi = updateHeadlessApi;
const removeHeadlessApi = (cwd, apiName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield headlessRemoveResource(cwd, 'api', apiName);
});
exports.removeHeadlessApi = removeHeadlessApi;
const addHeadlessAuth = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'auth', 'add', request);
});
exports.addHeadlessAuth = addHeadlessAuth;
const updateHeadlessAuth = (cwd, request, settings) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'auth', 'update', request, true, false, settings);
});
exports.updateHeadlessAuth = updateHeadlessAuth;
const removeHeadlessAuth = (cwd, authName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield headlessRemoveResource(cwd, 'auth', authName);
});
exports.removeHeadlessAuth = removeHeadlessAuth;
const headlessAuthImport = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'auth', 'import', request);
});
exports.headlessAuthImport = headlessAuthImport;
const addHeadlessStorage = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'storage', 'add', request);
});
exports.addHeadlessStorage = addHeadlessStorage;
const importHeadlessStorage = (cwd, request, reject = true) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'storage', 'import', request, reject);
});
exports.importHeadlessStorage = importHeadlessStorage;
const removeHeadlessStorage = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'storage', 'remove', request);
});
exports.removeHeadlessStorage = removeHeadlessStorage;
const updateHeadlessStorage = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'storage', 'update', request);
});
exports.updateHeadlessStorage = updateHeadlessStorage;
const addHeadlessGeo = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'geo', 'add', request);
});
exports.addHeadlessGeo = addHeadlessGeo;
const updateHeadlessGeo = (cwd, request) => __awaiter(void 0, void 0, void 0, function* () {
    return yield executeHeadlessCommand(cwd, 'geo', 'update', request);
});
exports.updateHeadlessGeo = updateHeadlessGeo;
const headlessRemoveResource = (cwd, category, resourceName) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, execa_1.default)((0, __1.getCLIPath)(), ['remove', category, resourceName, '--yes'], { cwd });
});
const executeHeadlessCommand = (cwd, category, operation, request, reject = true, allowDestructiveUpdates = false, settings = { testingWithLatestCodebase: false }) => __awaiter(void 0, void 0, void 0, function* () {
    const args = [operation, category, '--headless'];
    if (allowDestructiveUpdates) {
        args.push('--allow-destructive-graphql-schema-updates');
    }
    const cliPath = (0, __1.getCLIPath)(settings.testingWithLatestCodebase);
    return yield (0, execa_1.default)(cliPath, args, { input: JSON.stringify(request), cwd, reject });
});
//# sourceMappingURL=headless.js.map