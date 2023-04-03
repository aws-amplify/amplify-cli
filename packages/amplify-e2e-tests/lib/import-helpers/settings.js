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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDynamoDBSettings = exports.createStorageSettings = exports.createIDPAndUserPoolWithOAuthSettings = exports.createUserPoolOnlyWithOAuthSettings = exports.createNoOAuthSettings = void 0;
var createNoOAuthSettings = function (projectPrefix, shortId) {
    return {
        resourceName: "".concat(projectPrefix, "res").concat(shortId),
        userPoolName: "".concat(projectPrefix, "up").concat(shortId),
    };
};
exports.createNoOAuthSettings = createNoOAuthSettings;
var createUserPoolOnlyWithOAuthSettings = function (projectPrefix, shortId) {
    return {
        resourceName: "".concat(projectPrefix, "oares").concat(shortId),
        userPoolName: "".concat(projectPrefix, "oaup").concat(shortId),
        domainPrefix: "".concat(projectPrefix, "oadom").concat(shortId),
        signInUrl1: 'https://sin1/',
        signInUrl2: 'https://sin2/',
        signOutUrl1: 'https://sout1/',
        signOutUrl2: 'https://sout2/',
        facebookAppId: 'facebookAppId',
        facebookAppSecret: 'facebookAppSecret',
        googleAppId: 'googleAppId',
        googleAppSecret: 'googleAppSecret',
        amazonAppId: 'amazonAppId',
        amazonAppSecret: 'amazonAppSecret',
        appleAppClientId: 'com.fake.app',
        appleAppTeamId: '2QLEWNDK6K',
        appleAppKeyID: '2QLZXKYJ8J',
        appleAppPrivateKey: '----BEGIN PRIVATE KEY----MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw----END PRIVATE KEY----',
    };
};
exports.createUserPoolOnlyWithOAuthSettings = createUserPoolOnlyWithOAuthSettings;
var createIDPAndUserPoolWithOAuthSettings = function (projectPrefix, shortId) {
    var settings = (0, exports.createUserPoolOnlyWithOAuthSettings)(projectPrefix, shortId);
    return __assign(__assign({}, settings), { allowUnauthenticatedIdentities: true, identityPoolName: "".concat(projectPrefix, "oaidp").concat(shortId), idpFacebookAppId: 'idpFacebookAppId', idpGoogleAppId: 'idpGoogleAppId', idpAmazonAppId: 'idpAmazonAppId', idpAppleAppId: 'idpAppleId' });
};
exports.createIDPAndUserPoolWithOAuthSettings = createIDPAndUserPoolWithOAuthSettings;
var createStorageSettings = function (projectPrefix, shortId) {
    return {
        resourceName: "".concat(projectPrefix, "res").concat(shortId),
        bucketName: "".concat(projectPrefix, "bkt").concat(shortId),
    };
};
exports.createStorageSettings = createStorageSettings;
var createDynamoDBSettings = function (projectPrefix, shortId) {
    return {
        resourceName: "".concat(projectPrefix, "res").concat(shortId),
        tableName: "".concat(projectPrefix, "tbl").concat(shortId),
        gsiName: "".concat(projectPrefix, "gsi").concat(shortId),
    };
};
exports.createDynamoDBSettings = createDynamoDBSettings;
//# sourceMappingURL=settings.js.map