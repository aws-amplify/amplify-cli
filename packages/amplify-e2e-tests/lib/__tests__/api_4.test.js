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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var aws_appsync_1 = __importStar(require("aws-appsync"));
var graphql_tag_1 = __importDefault(require("graphql-tag"));
global.fetch = require('node-fetch');
describe('multi-key GSI behavior', function () {
    var projName = 'multikey';
    var firstName = 'John';
    var lastName = 'Doe';
    var age = 23;
    var birthDate = '1998-03-02';
    var nickname = 'Johnny';
    var height = 72;
    var eyeColor = 'purple'; // he's a special boy
    var getPersonByNameAndAge = 'getPersonByNameAndAge';
    var getPersonByNicknameAndHeight = 'getPersonByNicknameAndHeight';
    var appSyncClient;
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projName)];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'multi-gsi.graphql')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    appSyncClient = getAppSyncClientFromProj(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not include record in GSI when create mutation does not specify GSI fields', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createMutation, createResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    createMutation = "\n      mutation CreatePerson {\n        createPerson(input: {\n          firstName: \"".concat(firstName, "\",\n          lastName: \"").concat(lastName, "\"\n        }) {\n          id\n        }\n      }\n\n    ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 1:
                    createResult = _a.sent();
                    expect(createResult.errors).toBeUndefined();
                    expect(createResult.data).toBeDefined();
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 0)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, verifyGetPersonByNicknameAndHeight(firstName, 0)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('only includes record in specified GSI when multiple keys in schema but create mutation only includes one', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createMutation, createResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    createMutation = "\n      mutation CreatePerson {\n        createPerson(input: {\n          firstName: \"".concat(firstName, "\",\n          lastName: \"").concat(lastName, "\",\n          age: ").concat(age, ",\n          birthDate: \"").concat(birthDate, "\",\n        }) {\n          id\n        }\n      }\n    ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 1:
                    createResult = _a.sent();
                    expect(createResult.errors).toBeUndefined();
                    expect(createResult.data).toBeDefined();
                    // check that specified GSI is included in results
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 1, { age: age, birthDate: birthDate })];
                case 2:
                    // check that specified GSI is included in results
                    _a.sent();
                    // check that unspecified GSI is not included
                    return [4 /*yield*/, verifyGetPersonByNicknameAndHeight(firstName, 0)];
                case 3:
                    // check that unspecified GSI is not included
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('does not modify GSI when update mutation does not include GSI fields', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createMutation, createResult, id, updateMutation, updateResult;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    createMutation = "\n      mutation CreatePerson {\n        createPerson(input: {\n          firstName: \"".concat(firstName, "\",\n          lastName: \"").concat(lastName, "\",\n          age: ").concat(age, ",\n          birthDate: \"").concat(birthDate, "\",\n        }) {\n          id\n        }\n      }\n    ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 1:
                    createResult = _c.sent();
                    expect(createResult.errors).toBeUndefined();
                    id = (_b = (_a = createResult === null || createResult === void 0 ? void 0 : createResult.data) === null || _a === void 0 ? void 0 : _a.createPerson) === null || _b === void 0 ? void 0 : _b.id;
                    expect(id).toBeDefined();
                    // record should be included in GSI
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 1, { age: age, birthDate: birthDate })];
                case 2:
                    // record should be included in GSI
                    _c.sent();
                    updateMutation = "\n      mutation UpdatePerson {\n        updatePerson(input: {\n          id: \"".concat(id, "\",\n          firstName: \"").concat(firstName, "\",\n          lastName: \"").concat(lastName, "\",\n          eyeColor: \"").concat(eyeColor, "\",\n        }) {\n          id\n        }\n      }\n    ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(updateMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 3:
                    updateResult = _c.sent();
                    expect(updateResult.errors).toBeUndefined();
                    // GSI fields should be unmodified
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 1, { age: age, birthDate: birthDate })];
                case 4:
                    // GSI fields should be unmodified
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('only modifies specified GSI when multiple keys in schema but update mutation only includes one', function () { return __awaiter(void 0, void 0, void 0, function () {
        var createMutation, createResult, id, newNickname, newHeight, updateMutation, updateResult;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    createMutation = "\n    mutation CreatePerson {\n      createPerson(input: {\n        firstName: \"".concat(firstName, "\",\n        lastName: \"").concat(lastName, "\",\n        age: ").concat(age, ",\n        birthDate: \"").concat(birthDate, "\",\n        nickname: \"").concat(nickname, "\",\n        height: ").concat(height, ",\n      }) {\n        id\n      }\n    }\n  ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 1:
                    createResult = _c.sent();
                    expect(createResult.errors).toBeUndefined();
                    id = (_b = (_a = createResult === null || createResult === void 0 ? void 0 : createResult.data) === null || _a === void 0 ? void 0 : _a.createPerson) === null || _b === void 0 ? void 0 : _b.id;
                    expect(id).toBeDefined();
                    // record should be in both GSIs
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 1, { age: age, birthDate: birthDate })];
                case 2:
                    // record should be in both GSIs
                    _c.sent();
                    return [4 /*yield*/, verifyGetPersonByNicknameAndHeight(firstName, 1, { nickname: nickname, height: height })];
                case 3:
                    _c.sent();
                    newNickname = 'Jon-jon';
                    newHeight = 71;
                    updateMutation = "\n      mutation UpdatePerson {\n        updatePerson(input: {\n          id: \"".concat(id, "\",\n          firstName: \"").concat(firstName, "\",\n          lastName: \"").concat(lastName, "\",\n          nickname: \"").concat(newNickname, "\",\n          height: ").concat(newHeight, ",\n        }) {\n          id\n        }\n      }\n    ");
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(updateMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 4:
                    updateResult = _c.sent();
                    expect(updateResult.errors).toBeUndefined();
                    // record should still be in both GSIs with updated values in one
                    return [4 /*yield*/, verifyGetPersonByNameAndAge(firstName, 1, { age: age, birthDate: birthDate })];
                case 5:
                    // record should still be in both GSIs with updated values in one
                    _c.sent();
                    return [4 /*yield*/, verifyGetPersonByNicknameAndHeight(firstName, 1, { nickname: newNickname, height: newHeight })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var getAppSyncClientFromProj = function (projRoot) {
        var meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        var region = meta.providers.awscloudformation.Region;
        var output = meta.api[projName].output;
        var url = output.GraphQLAPIEndpointOutput;
        var apiKey = output.GraphQLAPIKeyOutput;
        return new aws_appsync_1.default({
            url: url,
            region: region,
            disableOffline: true,
            auth: {
                type: aws_appsync_1.AUTH_TYPE.API_KEY,
                apiKey: apiKey,
            },
        });
    };
    // helper functions that query GSIs and assert the expected number of results were returned
    var verifyGetPersonByNameAndAge = function (firstName, expectedCount, beginsWith) { return __awaiter(void 0, void 0, void 0, function () {
        var query, queryInput, queryResult;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    query = beginsWith
                        ? /* GraphQL */ "\n        query GetPersonByNameAndAge($firstName: String, $beginsWith: ModelPersonByNameAndAgeCompositeKeyInput) {\n          ".concat(getPersonByNameAndAge, "(\n            firstName: $firstName,\n            ageBirthDate: {\n              beginsWith: $beginsWith\n            }) {\n            nextToken\n            items {\n              id\n            }\n          }\n        }\n      ")
                        : /* GraphQL */ "\n        query GetPersonByNameAndAge($firstName: String) {\n          ".concat(getPersonByNameAndAge, "(firstName: $firstName) {\n            nextToken\n            items {\n              id\n            }\n          }\n        }\n      ");
                    queryInput = {
                        firstName: firstName,
                        beginsWith: beginsWith,
                    };
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(query),
                            fetchPolicy: 'no-cache',
                            variables: queryInput,
                        })];
                case 1:
                    queryResult = _f.sent();
                    expect((_c = (_b = (_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a[getPersonByNameAndAge]) === null || _b === void 0 ? void 0 : _b.items) === null || _c === void 0 ? void 0 : _c.length).toBe(expectedCount);
                    expect((_e = (_d = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _d === void 0 ? void 0 : _d[getPersonByNameAndAge]) === null || _e === void 0 ? void 0 : _e.nextToken).toBeNull();
                    expect(queryResult === null || queryResult === void 0 ? void 0 : queryResult.errors).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); };
    var verifyGetPersonByNicknameAndHeight = function (firstName, expectedCount, beginsWith) { return __awaiter(void 0, void 0, void 0, function () {
        var query, queryInput, queryResult;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    query = beginsWith
                        ? /* GraphQL */ "\n      query GetPersonByNicknameAndHeight($firstName: String, $beginsWith: ModelPersonByNicknameAndHeightCompositeKeyInput) {\n        ".concat(getPersonByNicknameAndHeight, "(\n          firstName: $firstName,\n          nicknameHeight: {\n            beginsWith: $beginsWith\n          }) {\n          nextToken\n          items {\n            id\n          }\n        }\n      }\n    ")
                        : /* GraphQL */ "\n      query GetPersonByNicknameAndHeight($firstName: String) {\n        ".concat(getPersonByNicknameAndHeight, "(firstName: $firstName) {\n          nextToken\n          items {\n            id\n          }\n        }\n      }\n    ");
                    queryInput = {
                        firstName: firstName,
                        beginsWith: beginsWith,
                    };
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(query),
                            fetchPolicy: 'no-cache',
                            variables: queryInput,
                        })];
                case 1:
                    queryResult = _f.sent();
                    expect((_c = (_b = (_a = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _a === void 0 ? void 0 : _a[getPersonByNicknameAndHeight]) === null || _b === void 0 ? void 0 : _b.items) === null || _c === void 0 ? void 0 : _c.length).toBe(expectedCount);
                    expect((_e = (_d = queryResult === null || queryResult === void 0 ? void 0 : queryResult.data) === null || _d === void 0 ? void 0 : _d[getPersonByNicknameAndHeight]) === null || _e === void 0 ? void 0 : _e.nextToken).toBeNull();
                    expect(queryResult === null || queryResult === void 0 ? void 0 : queryResult.errors).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); };
});
//# sourceMappingURL=api_4.test.js.map