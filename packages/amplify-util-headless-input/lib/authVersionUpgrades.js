"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1toV2Upgrade = void 0;
const v1toV2Upgrade = (payload) => {
    var _a, _b;
    payload.version = 2;
    const userPoolConfig = ((_a = payload === null || payload === void 0 ? void 0 : payload.serviceConfiguration) === null || _a === void 0 ? void 0 : _a.userPoolConfiguration) || ((_b = payload === null || payload === void 0 ? void 0 : payload.serviceModification) === null || _b === void 0 ? void 0 : _b.userPoolModification);
    const pwRecoveryConfig = userPoolConfig === null || userPoolConfig === void 0 ? void 0 : userPoolConfig.passwordRecovery;
    if (!pwRecoveryConfig) {
        return payload;
    }
    switch (pwRecoveryConfig.deliveryMethod) {
        case 'EMAIL':
            userPoolConfig.autoVerifiedAttributes = [
                {
                    type: 'EMAIL',
                    verificationMessage: pwRecoveryConfig.emailMessage,
                    verificationSubject: pwRecoveryConfig.emailSubject,
                },
            ];
            break;
        case 'SMS':
            userPoolConfig.autoVerifiedAttributes = [
                {
                    type: 'PHONE_NUMBER',
                    verificationMessage: pwRecoveryConfig.smsMessage,
                },
            ];
    }
    delete userPoolConfig.passwordRecovery;
    return payload;
};
exports.v1toV2Upgrade = v1toV2Upgrade;
//# sourceMappingURL=authVersionUpgrades.js.map