"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerType = exports.AttributeType = void 0;
var AttributeType;
(function (AttributeType) {
    AttributeType["EMAIL"] = "email";
    AttributeType["PHONE_NUMBER"] = "phone_number";
    AttributeType["PREFERRED_USERNAME"] = "preferred_username";
})(AttributeType = exports.AttributeType || (exports.AttributeType = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["CreateAuthChallenge"] = "CreateAuthChallenge";
    TriggerType["CustomMessage"] = "CustomMessage";
    TriggerType["DefineAuthChallenge"] = "DefineAuthChallenge";
    TriggerType["PostAuthentication"] = "PostAuthentication";
    TriggerType["PostConfirmation"] = "PostConfirmation";
    TriggerType["PreAuthentication"] = "PreAuthentication";
    TriggerType["PreSignup"] = "PreSignUp";
    TriggerType["VerifyAuthChallengeResponse"] = "VerifyAuthChallengeResponse";
    TriggerType["PreTokenGeneration"] = "PreTokenGeneration";
})(TriggerType = exports.TriggerType || (exports.TriggerType = {}));
//# sourceMappingURL=cognito-user-input-types.js.map