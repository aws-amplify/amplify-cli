"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
var CognitoClient = /** @class */ (function () {
    function CognitoClient(userPoolConfig) {
        this.userPoolConfig = userPoolConfig;
        this.userPool = new amazon_cognito_identity_js_1.CognitoUserPool(this.userPoolConfig);
        this.loggedInUser = null;
    }
    CognitoClient.prototype.signUpUser = function (username, password, email) {
        return __awaiter(this, void 0, void 0, function () {
            var attributeList, dataEmail, attributeEmail;
            var _this = this;
            return __generator(this, function (_a) {
                attributeList = [];
                dataEmail = {
                    Name: 'email',
                    Value: email
                };
                attributeEmail = new amazon_cognito_identity_js_1.CognitoUserAttribute(dataEmail);
                attributeList.push(attributeEmail);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.userPool.signUp(username, password, attributeList, null, function (err, result) {
                            if (err) {
                                return reject(err);
                            }
                            _this.loggedInUser = result.user;
                            console.log('Logged in user: ' + _this.loggedInUser.getUsername());
                            return resolve(result.user);
                        });
                    })];
            });
        });
    };
    CognitoClient.prototype.getToken = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var that;
            return __generator(this, function (_a) {
                that = this;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // if (!that.loggedInUser) {
                        //     return reject('Not logged in')
                        // }
                        var cognitoUser = new amazon_cognito_identity_js_1.CognitoUser({ Username: username, Pool: that.userPool });
                        // const token = this.loggedInUser.getSignInUserSession().getAccessToken().getJwtToken()
                        // console.log(`getting token for user: ${token}`)
                        // return resolve(token)
                        cognitoUser.authenticateUser(new amazon_cognito_identity_js_1.AuthenticationDetails({ Username: username, Password: password }), {
                            onSuccess: function (result) {
                                // var accessToken = result.getAccessToken().getJwtToken();
                                var accessToken = result.getIdToken().getJwtToken();
                                console.log("Got token: " + accessToken);
                                return resolve(accessToken);
                            },
                            onFailure: function (err) {
                                console.log("Error getting token:");
                                console.log(err);
                                return reject(err);
                            },
                        });
                    })];
            });
        });
    };
    return CognitoClient;
}());
exports.CognitoClient = CognitoClient;
//# sourceMappingURL=CognitoClient.js.map