"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoUserPropertyVerified = exports.CognitoUserProperty = exports.CognitoUserAliasAttributes = exports.CognitoUserPoolSigninMethod = exports.CognitoPasswordConstraint = void 0;
var CognitoPasswordConstraint;
(function (CognitoPasswordConstraint) {
    CognitoPasswordConstraint["REQUIRE_LOWERCASE"] = "REQUIRE_LOWERCASE";
    CognitoPasswordConstraint["REQUIRE_UPPERCASE"] = "REQUIRE_UPPERCASE";
    CognitoPasswordConstraint["REQUIRE_DIGIT"] = "REQUIRE_DIGIT";
    CognitoPasswordConstraint["REQUIRE_SYMBOL"] = "REQUIRE_SYMBOL";
})(CognitoPasswordConstraint = exports.CognitoPasswordConstraint || (exports.CognitoPasswordConstraint = {}));
var CognitoUserPoolSigninMethod;
(function (CognitoUserPoolSigninMethod) {
    CognitoUserPoolSigninMethod["USERNAME"] = "USERNAME";
    CognitoUserPoolSigninMethod["EMAIL"] = "EMAIL";
    CognitoUserPoolSigninMethod["PHONE_NUMBER"] = "PHONE_NUMBER";
    CognitoUserPoolSigninMethod["EMAIL_AND_PHONE_NUMBER"] = "EMAIL_AND_PHONE_NUMBER";
})(CognitoUserPoolSigninMethod = exports.CognitoUserPoolSigninMethod || (exports.CognitoUserPoolSigninMethod = {}));
var CognitoUserAliasAttributes;
(function (CognitoUserAliasAttributes) {
    CognitoUserAliasAttributes["PREFERRED_USERNAME"] = "PREFERRED_USERNAME";
    CognitoUserAliasAttributes["EMAIL"] = "EMAIL";
    CognitoUserAliasAttributes["PHONE_NUMBER"] = "PHONE_NUMBER";
})(CognitoUserAliasAttributes = exports.CognitoUserAliasAttributes || (exports.CognitoUserAliasAttributes = {}));
var CognitoUserProperty;
(function (CognitoUserProperty) {
    CognitoUserProperty["ADDRESS"] = "ADDRESS";
    CognitoUserProperty["BIRTHDATE"] = "BIRTHDATE";
    CognitoUserProperty["EMAIL"] = "EMAIL";
    CognitoUserProperty["FAMILY_NAME"] = "FAMILY_NAME";
    CognitoUserProperty["MIDDLE_NAME"] = "MIDDLE_NAME";
    CognitoUserProperty["GENDER"] = "GENDER";
    CognitoUserProperty["LOCALE"] = "LOCALE";
    CognitoUserProperty["GIVEN_NAME"] = "GIVEN_NAME";
    CognitoUserProperty["NAME"] = "NAME";
    CognitoUserProperty["NICKNAME"] = "NICKNAME";
    CognitoUserProperty["PHONE_NUMBER"] = "PHONE_NUMBER";
    CognitoUserProperty["PREFERRED_USERNAME"] = "PREFERRED_USERNAME";
    CognitoUserProperty["PICTURE"] = "PICTURE";
    CognitoUserProperty["PROFILE"] = "PROFILE";
    CognitoUserProperty["UPDATED_AT"] = "UPDATED_AT";
    CognitoUserProperty["WEBSITE"] = "WEBSITE";
    CognitoUserProperty["ZONE_INFO"] = "ZONE_INFO";
})(CognitoUserProperty = exports.CognitoUserProperty || (exports.CognitoUserProperty = {}));
var CognitoUserPropertyVerified;
(function (CognitoUserPropertyVerified) {
    CognitoUserPropertyVerified["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    CognitoUserPropertyVerified["PHONE_NUMBER_VERIFIED"] = "PHONE_NUMBER_VERIFIED";
})(CognitoUserPropertyVerified = exports.CognitoUserPropertyVerified || (exports.CognitoUserPropertyVerified = {}));
//# sourceMappingURL=add.js.map