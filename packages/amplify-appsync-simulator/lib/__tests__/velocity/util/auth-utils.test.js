"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../velocity/util/index");
const type_definition_1 = require("../../../type-definition");
const stubInfo = {};
const mockInfo = stubInfo;
describe('$util.authType', () => {
    it('should return API Key Authorization', () => {
        const executionContext = {
            headers: { 'x-api-key': 'da-fake-key' },
            requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            appsyncErrors: [],
        };
        const util = (0, index_1.create)(undefined, undefined, mockInfo, executionContext);
        expect(util.authType()).toEqual('API Key Authorization');
    });
    it('should return IAM Authorization', () => {
        const executionContext = {
            headers: { 'x-api-key': 'da-fake-key' },
            requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
            appsyncErrors: [],
        };
        const util = (0, index_1.create)(undefined, undefined, mockInfo, executionContext);
        expect(util.authType()).toEqual('IAM Authorization');
    });
    it('should return Open ID Connect Authorization', () => {
        const executionContext = {
            headers: { 'x-api-key': 'da-fake-key' },
            requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
            appsyncErrors: [],
        };
        const util = (0, index_1.create)(undefined, undefined, mockInfo, executionContext);
        expect(util.authType()).toEqual('Open ID Connect Authorization');
    });
    it('should return User Pool Authorization', () => {
        const executionContext = {
            headers: { 'x-api-key': 'da-fake-key' },
            requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
            appsyncErrors: [],
        };
        const util = (0, index_1.create)(undefined, undefined, mockInfo, executionContext);
        expect(util.authType()).toEqual('User Pool Authorization');
    });
});
//# sourceMappingURL=auth-utils.test.js.map