"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const type_definition_1 = require("../../../type-definition");
const helpers_1 = require("../../../utils/auth-helpers/helpers");
jest.mock('jwt-decode');
describe('auth helpers', () => {
    let token;
    beforeEach(() => {
        token = {
            iss: 'cognito.aws.amazon.com',
            sub: 'sub',
            exp: 2986225803296,
            aud: 'aud',
            iat: 1586225803296,
            nbf: 1586225803296,
            username: 'user-1',
            'cognito:username': 'user1',
        };
    });
    describe('extractJwtToken', () => {
        const mockJwtDecode = jwt_decode_1.default;
        beforeEach(() => {
            jest.resetAllMocks();
        });
        it('should return token', () => {
            mockJwtDecode.mockReturnValue(token);
            const mockEncodedToken = 'token';
            expect((0, jwt_decode_1.default)(mockEncodedToken)).toEqual(token);
            expect(mockJwtDecode).toHaveBeenCalledWith(mockEncodedToken);
        });
        it('should return null when token is empty or invalid', () => {
            mockJwtDecode.mockRestore();
            expect((0, jwt_decode_1.default)(null)).toBeUndefined();
        });
    });
    describe('isValidOIDCToken', () => {
        const configuredAuthTypes = [
            {
                authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            },
            {
                authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
                openIDConnectConfig: {
                    Issuer: 'http://amazon.com',
                },
            },
            {
                authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
                openIDConnectConfig: {
                    Issuer: 'cognito.aws.amazon.com',
                },
            },
        ];
        it('should return true when token has allowed issuer', () => {
            expect((0, helpers_1.isValidOIDCToken)(token, configuredAuthTypes)).toBeTruthy();
        });
        it('should return true when token has allowed issuer ending with slash', () => {
            token.iss = 'http://amazon.com/';
            expect((0, helpers_1.isValidOIDCToken)(token, configuredAuthTypes)).toBeTruthy();
        });
        it('should return false when token does not have valid issuer', () => {
            token.iss = 'invalid-issuer';
            expect((0, helpers_1.isValidOIDCToken)(token, configuredAuthTypes)).toBeFalsy();
        });
        it('should return false when there are no oidc providers configured', () => {
            expect((0, helpers_1.isValidOIDCToken)(token, [
                {
                    authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
                },
            ])).toBeFalsy();
        });
    });
    describe('extractHeader', () => {
        it('should return the header when the key match', () => {
            expect((0, helpers_1.extractHeader)({ authorization: 'abcd' }, 'authorization')).toEqual('abcd');
            expect((0, helpers_1.extractHeader)({ Authorization: 'abcd' }, 'authorization')).toEqual('abcd');
        });
        it('should return undefined when there are no matching headers', () => {
            expect((0, helpers_1.extractHeader)({ authorization: 'abcd' }, 'something-else')).toBeUndefined();
        });
    });
    describe('getAllowedAuthTypes', () => {
        it('should merge all auth types', () => {
            const config = {
                name: 'appsync-api',
                additionalAuthenticationProviders: [
                    {
                        authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
                        openIDConnectConfig: {
                            Issuer: 'cognito',
                        },
                    },
                    {
                        authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
                    },
                    {
                        authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
                        cognitoUserPoolConfig: {
                            AppIdClientRegex: 'my-app',
                        },
                    },
                ],
                defaultAuthenticationType: {
                    authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
                },
            };
            expect((0, helpers_1.getAllowedAuthTypes)(config)).toEqual([
                type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
                type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
                type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
                type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
            ]);
        });
    });
});
//# sourceMappingURL=helpers.test.js.map