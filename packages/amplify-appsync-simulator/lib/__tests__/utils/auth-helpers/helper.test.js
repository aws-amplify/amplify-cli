"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_definition_1 = require("../../../type-definition");
const helpers_1 = require("../../../utils/auth-helpers/helpers");
describe('extractIamToken', () => {
    const appSyncConfig = {
        name: 'testApi',
        additionalAuthenticationProviders: [],
        authRoleName: 'myAuthRole',
        unAuthRoleName: 'myUnAuthRole',
        defaultAuthenticationType: { authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM },
        authAccessKeyId: 'testAccessKeyId',
        accountId: 'testAccount',
    };
    it('should return authRole when the accessKeyId matches', () => {
        const iamToken = (0, helpers_1.extractIamToken)(`AWS4-HMAC-SHA256 Credential=${appSyncConfig.authAccessKeyId}/${new Date().toISOString()}/someService/aaa`, appSyncConfig);
        expect(iamToken.userArn).toEqual(`arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.authRoleName}`);
    });
    it('should return unAuth user when accessKeyId does not match', () => {
        const iamToken = (0, helpers_1.extractIamToken)(`AWS4-HMAC-SHA256 Credential=AKIUNAUTHAcceeKeyId/${new Date().toISOString()}/someService/aaa`, appSyncConfig);
        expect(iamToken.userArn).toEqual(`arn:aws:sts::${appSyncConfig.accountId}:${appSyncConfig.unAuthRoleName}`);
    });
    it('should throw accessKeyId error when IAM token is not in the right format', () => {
        expect(() => (0, helpers_1.extractIamToken)(`AWS4-HMAC-SHA256 `, appSyncConfig)).toThrowError('missing accessKeyId');
    });
});
//# sourceMappingURL=helper.test.js.map