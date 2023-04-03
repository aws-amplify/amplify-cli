"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSmsOption = void 0;
const awsCognito_user_input_types_1 = require("../service-walkthrough-types/awsCognito-user-input-types");
const configureSmsOption = (props) => {
    var _a, _b, _c, _d;
    return ((_a = props.autoVerifiedAttributes) === null || _a === void 0 ? void 0 : _a.includes('phone_number')) ||
        (props.mfaConfiguration !== 'OFF' && ((_b = props.mfaTypes) === null || _b === void 0 ? void 0 : _b.includes('SMS Text Message'))) ||
        ((_c = props.requiredAttributes) === null || _c === void 0 ? void 0 : _c.includes('phone_number')) ||
        ((_d = props.usernameAttributes) === null || _d === void 0 ? void 0 : _d.includes(awsCognito_user_input_types_1.AttributeType.PHONE_NUMBER));
};
exports.configureSmsOption = configureSmsOption;
//# sourceMappingURL=configure-sms.js.map