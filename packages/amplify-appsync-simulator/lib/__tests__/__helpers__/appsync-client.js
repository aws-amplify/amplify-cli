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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSyncClient = exports.gql = void 0;
const http = __importStar(require("http"));
const __1 = require("../../");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const gql = (chunks, ...variables) => chunks
    .reduce((accumulator, chunk, index) => `${accumulator}${chunk}${index in variables ? variables[index] : ''}`, '')
    .replace(/^\s+|\s$/g, '');
exports.gql = gql;
async function appSyncClient({ appSync, query, variables, auth, }) {
    var _a;
    const headers = {
        'Content-Type': 'application/json',
    };
    switch (auth === null || auth === void 0 ? void 0 : auth.type) {
        case __1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY:
            headers['x-api-key'] = auth.apiKey;
            break;
        case __1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS:
            headers.Authorization = jsonwebtoken_1.default.sign({
                username: auth.username,
                'cognito:groups': (_a = auth.groups) !== null && _a !== void 0 ? _a : [],
            }, 'mockSecret', { issuer: `https://cognito-idp.mock-region.amazonaws.com/mockUserPool` });
            break;
        case __1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM:
        default:
            headers.Authorization = `AWS4-HMAC-SHA256 Credential=${appSync.appSyncConfig.authAccessKeyId}/2021-12-12`;
    }
    return await new Promise((resolve, reject) => {
        const httpRequest = http.request(appSync.url, {
            host: 'localhost',
            path: '/graphql',
            method: 'POST',
            headers,
        }, (result) => {
            let data = '';
            result
                .setEncoding('utf-8')
                .on('data', (chunk) => {
                data += chunk;
            })
                .once('end', () => {
                var _a, _b;
                if (!((_a = result.headers['content-type']) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('application/json'))) {
                    return reject(new Error(`AppSync GraphQL result failed: ${data}`));
                }
                const body = JSON.parse(data);
                if ((_b = body.errors) === null || _b === void 0 ? void 0 : _b.length) {
                    return reject(new Error(`GraphQL request error(s): ${JSON.stringify(body.errors)}`));
                }
                resolve(body.data);
            })
                .once('error', (err) => reject(err));
        });
        httpRequest.end(JSON.stringify({ query, variables }));
    });
}
exports.appSyncClient = appSyncClient;
//# sourceMappingURL=appsync-client.js.map