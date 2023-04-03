"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLegacyAllNotificationChannel = exports.addLegacySmsNotificationChannel = void 0;
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
/**
 * Adds notification resource for a given channel
 */
const addLegacySmsNotificationChannel = (cwd, resourceName, hasAnalytics = false) => __awaiter(void 0, void 0, void 0, function* () {
    const chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(false), ['add', 'notification'], { cwd, stripColors: true });
    (0, amplify_e2e_core_1.singleSelect)(chain.wait('Choose the push notification channel to enable'), 'SMS', ['APNS', 'FCM', 'Email', 'SMS']);
    if (!hasAnalytics) {
        chain.wait('Provide your pinpoint resource name').sendLine(resourceName);
    }
    return chain.wait(`The SMS channel has been successfully enabled`).sendEof().runAsync();
});
exports.addLegacySmsNotificationChannel = addLegacySmsNotificationChannel;
/**
 * Removes all notifications channels
 */
const removeLegacyAllNotificationChannel = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(false), ['remove', 'notifications'], { cwd, stripColors: true })
        .wait('Choose what to remove. (Use arrow keys)')
        .sendKeyDown() // The Pinpoint application
        .sendCarriageReturn()
        .wait(`Confirm that you want to delete the associated Amazon Pinpoint application`)
        .sendConfirmYes()
        .sendEof()
        .runAsync();
});
exports.removeLegacyAllNotificationChannel = removeLegacyAllNotificationChannel;
//# sourceMappingURL=notifications-helpers.js.map