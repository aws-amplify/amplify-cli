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
exports.javascriptValidate = exports.flutterValidate = exports.androidValidate = exports.iosValidate = exports.runPinpointConfigTest = void 0;
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_2 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../../schema-api-directives/authHelper");
var runPinpointConfigTest = function (projectRoot, envName, frontendConfig, validate) { return __awaiter(void 0, void 0, void 0, function () {
    var appId, secondRoot;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                expect(appId).toBeDefined();
                return [4 /*yield*/, (0, amplify_e2e_core_1.addPinpointAnalytics)(projectRoot)];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
            case 2:
                _a.sent();
                validate(projectRoot, true);
                return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('notifications-pinpoint-pull')];
            case 3:
                secondRoot = _a.sent();
                _a.label = 4;
            case 4:
                _a.trys.push([4, , 6, 7]);
                return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPullNonInteractive)(secondRoot, {
                        appId: appId,
                        frontend: frontendConfig,
                        envName: envName,
                    })];
            case 5:
                _a.sent();
                validate(secondRoot, true);
                return [3 /*break*/, 7];
            case 6:
                (0, amplify_e2e_core_1.deleteProjectDir)(secondRoot);
                return [7 /*endfinally*/];
            case 7: return [4 /*yield*/, (0, amplify_e2e_core_1.removeAnalytics)(projectRoot)];
            case 8:
                _a.sent();
                return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
            case 9:
                _a.sent();
                validate(projectRoot, false);
                return [2 /*return*/];
        }
    });
}); };
exports.runPinpointConfigTest = runPinpointConfigTest;
var iosValidate = function (projectRoot, hasAnalytics) {
    var configPath = path.join(projectRoot, 'amplifyconfiguration.json');
    iosAndroidValidate(configPath, hasAnalytics);
};
exports.iosValidate = iosValidate;
var androidValidate = function (projectRoot, hasAnalytics) {
    var configPath = path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
    iosAndroidValidate(configPath, hasAnalytics);
};
exports.androidValidate = androidValidate;
var flutterValidate = function (projectRoot, hasAnalytics) {
    var config = (0, amplify_e2e_core_2.getAmplifyFlutterConfig)(projectRoot);
    validateNativeJsonConfig(config, hasAnalytics);
};
exports.flutterValidate = flutterValidate;
var javascriptValidate = function (projectRoot, hasAnalytics) {
    var _a, _b, _c, _d;
    var config = (0, authHelper_1.getAWSExports)(projectRoot);
    if (hasAnalytics) {
        expect((_b = (_a = config === null || config === void 0 ? void 0 : config.Analytics) === null || _a === void 0 ? void 0 : _a.AWSPinpoint) === null || _b === void 0 ? void 0 : _b.appId).toBeDefined();
        expect((_d = (_c = config === null || config === void 0 ? void 0 : config.Analytics) === null || _c === void 0 ? void 0 : _c.AWSPinpoint) === null || _d === void 0 ? void 0 : _d.region).toBeDefined();
    }
    else {
        expect(config === null || config === void 0 ? void 0 : config.Analytics).not.toBeDefined();
        expect(config === null || config === void 0 ? void 0 : config.Analytics).not.toBeDefined();
    }
};
exports.javascriptValidate = javascriptValidate;
var iosAndroidValidate = function (configPath, hasAnalytics) {
    expect(fs.existsSync(configPath)).toBe(true);
    var config = amplify_cli_core_1.JSONUtilities.readJson(configPath);
    validateNativeJsonConfig(config, hasAnalytics);
};
var validateNativeJsonConfig = function (config, hasAnalytics) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (hasAnalytics) {
        expect((_d = (_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.analytics) === null || _a === void 0 ? void 0 : _a.plugins) === null || _b === void 0 ? void 0 : _b.awsPinpointAnalyticsPlugin) === null || _c === void 0 ? void 0 : _c.pinpointAnalytics) === null || _d === void 0 ? void 0 : _d.appId).toBeDefined();
        expect((_h = (_g = (_f = (_e = config === null || config === void 0 ? void 0 : config.analytics) === null || _e === void 0 ? void 0 : _e.plugins) === null || _f === void 0 ? void 0 : _f.awsPinpointAnalyticsPlugin) === null || _g === void 0 ? void 0 : _g.pinpointAnalytics) === null || _h === void 0 ? void 0 : _h.region).toBeDefined();
    }
    else {
        expect((_k = (_j = config === null || config === void 0 ? void 0 : config.analytics) === null || _j === void 0 ? void 0 : _j.plugins) === null || _k === void 0 ? void 0 : _k.awsPinpointAnalyticsPlugin).not.toBeDefined();
        expect((_m = (_l = config === null || config === void 0 ? void 0 : config.analytics) === null || _l === void 0 ? void 0 : _l.plugins) === null || _m === void 0 ? void 0 : _m.awsPinpointAnalyticsPlugin).not.toBeDefined();
    }
};
//# sourceMappingURL=analytics-pinpoint-config-util.js.map