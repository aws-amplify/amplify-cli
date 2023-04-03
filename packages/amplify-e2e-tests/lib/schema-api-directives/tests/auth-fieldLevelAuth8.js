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
exports.expected_result_query = exports.query = exports.expected_result_mutation = exports.mutation = exports.schema = exports.runTest = void 0;
//handle subscription from another user
var common_1 = require("../common");
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                //test owner
                return [4 /*yield*/, (0, common_1.runAuthTest)(projectDir, testModule)];
                case 1:
                    //test owner
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
//schema
exports.schema = "\ntype Employee @model\n  @auth(rules: [\n\t  { allow: owner },\n\t  { allow: groups, groups: [\"Admin\"] }\n  ]) {\n\tid: ID!\n\tname: String!\n\taddress: String!\n\tssn: String @auth(rules: [{allow: owner}])\n}\n\n##fieldLevelAuth8";
//mutations
exports.mutation = "\n#error: title and content are not in the Employee type\n#change: changed them to name and address\n#change: add id in the input so test can query employee by the id\nmutation {\n  createEmployee(input: {\n    id: \"1\"\n    name: \"Nadia\"\n    address: \"123 First Ave\"\n    ssn: \"392-95-2716\"\n  }){\n    id\n    name\n    address\n    ssn\n  }\n}";
exports.expected_result_mutation = {
    data: {
        createEmployee: {
            id: '1',
            name: 'Nadia',
            address: '123 First Ave',
            ssn: null,
        },
    },
};
//queries
exports.query = "\n query GetEmployee {\n    getEmployee(id: \"1\") {\n      id\n      name\n      address\n      ssn\n      owner\n    }\n}";
exports.expected_result_query = {
    data: {
        getEmployee: {
            id: '1',
            name: 'Nadia',
            address: '123 First Ave',
            ssn: '392-95-2716',
            owner: 'user1',
        },
    },
};
//# sourceMappingURL=auth-fieldLevelAuth8.js.map