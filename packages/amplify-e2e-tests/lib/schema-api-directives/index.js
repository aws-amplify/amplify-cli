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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.testSchema = void 0;
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var common_1 = require("./common");
var functionTester_1 = require("./functionTester");
//The contents in the test files might be modified from its original version in the Amplify CLI doc,
//and mutations or queries might be added to test the input schema.
//Modification are marked in the test file:
//#change: modified the original content, such as adding the missing pieces in imcomplete schemas, etc.
//#error: corrected error in the original content
//#extra: the content does not exist in the Amplify CLI document, added for the completeness of the testing, such as the mutation needed to test subscriptions
// to deal with subscriptions in node env
global.WebSocket = require('ws');
function testSchema(projectDir, directive, section, appName) {
    return __awaiter(this, void 0, void 0, function () {
        var testModule, testFilePath, _a, _b, err_1;
        return __generator(this, function (_c) {
            var _d;
            switch (_c.label) {
                case 0:
                    testFilePath = path.join(__dirname, 'tests', "".concat(directive, "-").concat(section, ".ts"));
                    if (!fs.existsSync(testFilePath)) {
                        throw new Error("Missing test file ".concat(directive, "-").concat(section, ".ts"));
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (_d = testFilePath, Promise.resolve().then(function () { return __importStar(require(_d)); }))];
                case 2:
                    testModule = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    throw new Error("Unable to load test file ".concat(directive, "-").concat(section, ".ts"));
                case 4:
                    _c.trys.push([4, 14, , 15]);
                    if (!testModule.runTest) return [3 /*break*/, 6];
                    return [4 /*yield*/, testModule.runTest(projectDir, testModule, appName)];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 6:
                    _b = directive;
                    switch (_b) {
                        case 'auth': return [3 /*break*/, 7];
                        case 'function': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 11];
                case 7: return [4 /*yield*/, (0, common_1.runAuthTest)(projectDir, testModule)];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 9: return [4 /*yield*/, (0, functionTester_1.runFunctionTest)(projectDir, testModule)];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, (0, common_1.runTest)(projectDir, testModule)];
                case 12:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/, true];
                case 14:
                    err_1 = _c.sent();
                    console.log("Test failed for ".concat(directive, "-").concat(section));
                    if (testModule && testModule.schema) {
                        console.log("Input schema: ".concat(testModule.schema));
                    }
                    console.log(err_1);
                    return [2 /*return*/, false];
                case 15: return [2 /*return*/];
            }
        });
    });
}
exports.testSchema = testSchema;
__exportStar(require("./authHelper"), exports);
//# sourceMappingURL=index.js.map