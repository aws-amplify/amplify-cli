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
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
describe('nodejs version migration tests', function () {
    var projectRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('node-function')];
                case 1:
                    projectRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add simple function and migrate node version', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, meta, projectConfigFileName, projectConfigContent, authResourceName, authStackFileName, authStackContent, functionResourceName, functionStackFileName, functionStackContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, {})];
                case 1:
                    _a.sent();
                    functionName = "nodefunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projectRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs')];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    projectConfigFileName = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
                    projectConfigContent = fs.readFileSync(projectConfigFileName).toString();
                    projectConfigContent = projectConfigContent.replace('3.1', '3.0');
                    fs.writeFileSync(projectConfigFileName, projectConfigContent, 'utf-8');
                    authResourceName = Object.keys(meta.auth)[0];
                    authStackFileName = path.join(projectRoot, 'amplify', 'backend', 'auth', authResourceName, 'build', "".concat(authResourceName, "-cloudformation-template.json"));
                    authStackContent = fs.readFileSync(authStackFileName).toString();
                    authStackContent = authStackContent.replace('nodejs16.x', 'nodejs10.x');
                    fs.writeFileSync(authStackFileName, authStackContent, 'utf-8');
                    functionResourceName = Object.keys(meta.function)[0];
                    functionStackFileName = path.join(projectRoot, 'amplify', 'backend', 'function', functionResourceName, "".concat(functionResourceName, "-cloudformation-template.json"));
                    functionStackContent = fs.readFileSync(functionStackFileName).toString();
                    functionStackContent = functionStackContent.replace('nodejs16.x', 'nodejs10.x');
                    fs.writeFileSync(functionStackFileName, functionStackContent, 'utf-8');
                    // Executing amplify push triggers the migration
                    return [4 /*yield*/, amplifyNodeMigrationAndPush(projectRoot)];
                case 4:
                    // Executing amplify push triggers the migration
                    _a.sent();
                    projectConfigContent = fs.readFileSync(projectConfigFileName).toString();
                    authStackContent = fs.readFileSync(authStackFileName).toString();
                    functionStackContent = fs.readFileSync(functionStackFileName).toString();
                    expect(projectConfigContent.indexOf('3.1')).toBeGreaterThan(0);
                    expect(authStackContent.indexOf('nodejs16.x')).toBeGreaterThan(0);
                    expect(functionStackContent.indexOf('nodejs16.x')).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); });
    var amplifyNodeMigrationAndPush = function (cwd) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['push'], { cwd: cwd, stripColors: true, disableCIDetection: true })
                    .wait('Confirm to update the Node.js runtime version to nodejs')
                    .sendConfirmYes()
                    .wait('Node.js runtime version successfully updated')
                    .wait('Are you sure you want to continue?')
                    .sendYes()
                    .wait(/.*/)
                    .runAsync()];
        });
    }); };
});
//# sourceMappingURL=node.function.test.js.map