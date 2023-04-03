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
exports.AdminLoginServer = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const assert = __importStar(require("assert"));
const aws_sdk_1 = require("aws-sdk");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const jose = __importStar(require("jose"));
const lodash_1 = __importDefault(require("lodash"));
class AdminLoginServer {
    constructor(appId, originUrl, print) {
        this.port = 4242;
        this.host = '0.0.0.0';
        this.appId = appId;
        this.corsOptions = {
            origin: [originUrl],
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: 'Content-Type',
        };
        this.print = print;
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)(this.corsOptions));
        this.app.use(body_parser_1.default.json());
    }
    async startServer(callback) {
        await this.setupRoute(callback);
        this.server = this.app.listen(this.getPort(), this.getHost());
    }
    getHost() {
        return this.host;
    }
    getPort() {
        return this.port;
    }
    async getIdentityId(idToken, IdentityPoolId, region) {
        const cognitoIdentity = new aws_sdk_1.CognitoIdentity({ region });
        const login = idToken.payload.iss.replace('https://', '');
        const logins = {
            [login]: idToken.jwtToken,
        };
        const { IdentityId } = await cognitoIdentity
            .getId({
            IdentityPoolId,
            Logins: logins,
        })
            .promise();
        if (!IdentityId) {
            throw new amplify_cli_core_1.AmplifyError('AmplifyStudioLoginError', {
                message: 'IdentityId not defined. Amplify CLI was unable to retrieve credentials.',
            });
        }
        return IdentityId;
    }
    async setupRoute(callback) {
        this.app.post('/amplifyadmin/', async (req, res) => {
            if (!req.body || req.body.error) {
                this.shutdown();
                if (req.body.error === 'CANCELLED') {
                    this.print.info('Login canceled');
                    process.exit(0);
                }
                throw new amplify_cli_core_1.AmplifyError('AmplifyStudioLoginError', {
                    message: 'Failed to receive expected authentication tokens.',
                });
            }
            try {
                await this.storeTokens(req.body, this.appId);
                delete req.body;
                res.sendStatus(200);
            }
            catch (err) {
                res.sendStatus(500);
                throw new amplify_cli_core_1.AmplifyError('AmplifyStudioLoginError', {
                    message: `Failed to receive expected authentication tokens. Error: [${err}]`,
                }, err);
            }
            callback();
        });
        this.app.get('/ping', async (_, res) => {
            res.send({ success: true });
        });
    }
    async validateTokens(tokens) {
        const issuer = tokens.idToken.payload.iss;
        const audience = tokens.idToken.payload.aud;
        const N_JWKS = jose.createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
        const { payload: decodedJwtId } = await jose.jwtVerify(tokens.idToken.jwtToken, N_JWKS, { issuer, audience });
        if (Array.isArray(decodedJwtId.aud) && decodedJwtId.aud.length > 1) {
            assert.strictEqual(decodedJwtId.azp, audience);
        }
        assert.ok(typeof decodedJwtId.sub === 'string' && decodedJwtId.sub);
        assert.ok('iat' in decodedJwtId);
        assert.ok('exp' in decodedJwtId);
        const { payload: decodedJwtAccess } = await jose.jwtVerify(tokens.accessToken.jwtToken, N_JWKS);
        return lodash_1.default.isEqual(decodedJwtId, tokens.idToken.payload) && lodash_1.default.isEqual(decodedJwtAccess, tokens.accessToken.payload);
    }
    async storeTokens(payload, appId) {
        const areTokensValid = await this.validateTokens({
            idToken: payload.idToken,
            accessToken: payload.accessToken,
        });
        if (areTokensValid) {
            const IdentityId = await this.getIdentityId(payload.idToken, payload.IdentityPoolId, payload.region);
            const config = { ...payload, IdentityId };
            amplify_cli_core_1.stateManager.setAmplifyAdminConfigEntry(appId, config);
        }
    }
    shutdown() {
        this.server.close();
    }
}
exports.AdminLoginServer = AdminLoginServer;
//# sourceMappingURL=admin-login-server.js.map