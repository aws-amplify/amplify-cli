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
exports.createTestProject = exports.loadAppIdFromTeamProviderInfo = exports.cleanHostingLocally = exports.loadTypeFromTeamProviderInfo = void 0;
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var child_process_1 = require("child_process");
var util = __importStar(require("../util"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var constants_1 = require("./constants");
function loadTypeFromTeamProviderInfo(cwd, currEnv) {
    var teamProviderPath = path.join(cwd, 'amplify', 'team-provider-info.json');
    var content = (0, amplify_e2e_core_1.readJsonFile)(teamProviderPath);
    if (content &&
        content[currEnv] &&
        content[currEnv][constants_1.CATEGORIES] &&
        content[currEnv][constants_1.CATEGORIES][constants_1.HOSTING] &&
        content[currEnv][constants_1.CATEGORIES][constants_1.HOSTING][constants_1.RESOURCE] &&
        content[currEnv][constants_1.CATEGORIES][constants_1.HOSTING][constants_1.RESOURCE][constants_1.TYPE]) {
        return content[currEnv][constants_1.CATEGORIES][constants_1.HOSTING][constants_1.RESOURCE][constants_1.TYPE];
    }
    else {
        return constants_1.TYPE_UNKNOWN;
    }
}
exports.loadTypeFromTeamProviderInfo = loadTypeFromTeamProviderInfo;
function cleanHostingLocally(cwd, currEnv) {
    var hostingDirPath = path.join(cwd, 'amplify', 'backend', 'hosting');
    fs.removeSync(hostingDirPath);
    var currentHostingDirPath = path.join(cwd, 'amplify', '#current-cloud-backend', 'hosting');
    fs.removeSync(currentHostingDirPath);
    var teamProviderInfoFilePath = path.join(cwd, 'amplify', 'team-provider-info.json');
    var teamProviderInfo = (0, amplify_e2e_core_1.readJsonFile)(teamProviderInfoFilePath);
    if (teamProviderInfo[currEnv].categories && teamProviderInfo[currEnv].categories.hosting) {
        delete teamProviderInfo[currEnv].categories.hosting;
        fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));
    }
    var amplifyMetaFilePath = path.join(cwd, 'amplify', 'backend', 'amplify-meta.json');
    var amplifyMeta = (0, amplify_e2e_core_1.readJsonFile)(amplifyMetaFilePath);
    if (amplifyMeta.hosting) {
        delete amplifyMeta.hosting;
        fs.writeFileSync(amplifyMetaFilePath, JSON.stringify(amplifyMeta, null, 4));
    }
    var currentMetaFilePath = path.join(cwd, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    var currentAmplifyMeta = (0, amplify_e2e_core_1.readJsonFile)(currentMetaFilePath);
    if (currentAmplifyMeta.hosting) {
        delete currentAmplifyMeta.hosting;
        fs.writeFileSync(currentMetaFilePath, JSON.stringify(currentAmplifyMeta, null, 4));
    }
    var backendConfigFilePath = path.join(cwd, 'amplify', 'backend', 'backend-config.json');
    var backendConfig = (0, amplify_e2e_core_1.readJsonFile)(backendConfigFilePath);
    if (backendConfig.hosting) {
        delete backendConfig.hosting;
        fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, null, 4));
    }
    var currentBackendConfigFilePath = path.join(cwd, 'amplify', '#current-cloud-backend', 'backend-config.json');
    var currentBackendConfig = (0, amplify_e2e_core_1.readJsonFile)(currentBackendConfigFilePath);
    if (currentBackendConfig.hosting) {
        delete currentBackendConfig.hosting;
        fs.writeFileSync(currentBackendConfigFilePath, JSON.stringify(currentBackendConfig, null, 4));
    }
}
exports.cleanHostingLocally = cleanHostingLocally;
function loadAppIdFromTeamProviderInfo(cwd, currEnv) {
    var teamProviderPath = path.join(cwd, 'amplify', 'team-provider-info.json');
    var content = (0, amplify_e2e_core_1.readJsonFile)(teamProviderPath);
    console.log('content:*******');
    console.log(currEnv);
    if (content && content[currEnv] && content[currEnv][constants_1.PROVIDER] && content[currEnv][constants_1.PROVIDER][constants_1.APPID]) {
        return content[currEnv][constants_1.PROVIDER][constants_1.APPID];
    }
    else {
        return constants_1.TYPE_UNKNOWN;
    }
}
exports.loadAppIdFromTeamProviderInfo = loadAppIdFromTeamProviderInfo;
function createTestProject() {
    return __awaiter(this, void 0, void 0, function () {
        var projRoot, projectName, projectDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, util.createNewProjectDir('console-hosting')];
                case 1:
                    projRoot = _a.sent();
                    projectName = path.basename(projRoot);
                    projectDir = path.dirname(projRoot);
                    (0, child_process_1.spawnSync)('npx', ['create-react-app', '--scripts-version', '5.0.1', projectName], { cwd: projectDir });
                    return [2 /*return*/, projRoot];
            }
        });
    });
}
exports.createTestProject = createTestProject;
//# sourceMappingURL=utils.js.map