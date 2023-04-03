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
exports.toHaveValidPolicyConditionMatchingIdpId = exports.toBeIAMRoleWithArn = void 0;
var aws_sdk_1 = require("aws-sdk");
var toBeIAMRoleWithArn = function (roleName, arn) { return __awaiter(void 0, void 0, void 0, function () {
    var iam, pass, message, role, e_1, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                iam = new aws_sdk_1.IAM();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, iam.getRole({ RoleName: roleName }).promise()];
            case 2:
                role = (_a.sent()).Role;
                if (arn) {
                    pass = role.Arn === arn ? true : false;
                    if (pass) {
                        message = "role name ".concat(roleName, " has arn ").concat(arn);
                    }
                    else {
                        message = "expected ".concat(roleName, " to have ").concat(arn, ". Received ").concat(role.Arn);
                    }
                }
                else {
                    pass = true;
                }
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                pass = false;
                message = "Role ".concat(roleName, " does not exist");
                return [3 /*break*/, 4];
            case 4:
                result = {
                    message: function () { return message; },
                    pass: pass,
                };
                return [2 /*return*/, result];
        }
    });
}); };
exports.toBeIAMRoleWithArn = toBeIAMRoleWithArn;
var toHaveValidPolicyConditionMatchingIdpId = function (roleName, idpId) { return __awaiter(void 0, void 0, void 0, function () {
    var pass, message, iam, role, assumeRolePolicyDocument, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pass = false;
                message = '';
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                iam = new aws_sdk_1.IAM({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    sessionToken: process.env.AWS_SESSION_TOKEN,
                });
                return [4 /*yield*/, iam.getRole({ RoleName: roleName }).promise()];
            case 2:
                role = (_a.sent()).Role;
                assumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
                pass = assumeRolePolicyDocument.Statement.some(function (statement) {
                    if (statement.Condition) {
                        return (statement.Condition.StringEquals &&
                            statement.Condition.StringEquals['cognito-identity.amazonaws.com:aud'] &&
                            statement.Condition.StringEquals['cognito-identity.amazonaws.com:aud'] === idpId &&
                            statement.Condition['ForAnyValue:StringLike'] &&
                            statement.Condition['ForAnyValue:StringLike']['cognito-identity.amazonaws.com:amr'] &&
                            /authenticated/.test(statement.Condition['ForAnyValue:StringLike']['cognito-identity.amazonaws.com:amr']));
                    }
                    else {
                        return false;
                    }
                });
                message = pass ? 'Found Matching Condition' : 'Matching Condition does not exist';
                return [3 /*break*/, 4];
            case 3:
                e_2 = _a.sent();
                pass = false;
                message = 'IAM GetRole threw Error: ' + e_2.message;
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/, {
                    message: function () { return message; },
                    pass: pass,
                }];
        }
    });
}); };
exports.toHaveValidPolicyConditionMatchingIdpId = toHaveValidPolicyConditionMatchingIdpId;
//# sourceMappingURL=iamMatcher.js.map