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
exports.addNotificationChannel = exports.removeNotificationChannel = exports.removeAllNotificationChannel = void 0;
const __1 = require("..");
/**
 * removes all the notification channel
 */
const removeAllNotificationChannel = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'notifications'], { cwd, stripColors: true })
        .wait('Choose the notification channel to remove')
        .sendLine('All channels on Pinpoint resource')
        .wait(`All notifications have been disabled`)
        .sendEof()
        .runAsync();
});
exports.removeAllNotificationChannel = removeAllNotificationChannel;
/**
 * removes the notification channel
 */
const removeNotificationChannel = (cwd, channel) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'notifications'], { cwd, stripColors: true })
        .wait('Choose the notification channel to remove')
        .sendLine(channel)
        .wait(`The channel has been successfully disabled`)
        .sendEof()
        .runAsync();
});
exports.removeNotificationChannel = removeNotificationChannel;
/**
 * Adds notification resource for a given channel
 *
 * @param cwd the current working directory to run CLI in
 * @param settings settings required to add a notification channel
 * @param settings.resourceName the name to give to the created pinpoint resource
 * @param channel the channel to add
 */
const addNotificationChannel = (cwd, { resourceName }, channel, hasAnalytics = false, hasAuth = false, testingWithLatestCodebase = true) => __awaiter(void 0, void 0, void 0, function* () {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['add', 'notification'], { cwd, stripColors: true });
    chain.wait('Choose the notification channel to enable').sendLine(channel);
    if (!hasAnalytics) {
        chain.wait('Provide your pinpoint resource name').sendLine(resourceName);
    }
    if (!hasAuth) {
        chain.wait('Apps need authorization to send analytics events. Do you want to allow guests').sendCarriageReturn();
    }
    // channel specific prompts
    switch (channel) {
        case 'APNS |  Apple Push Notifications   ': {
            break;
        }
        case 'FCM  | » Firebase Push Notifications ': {
            break;
        }
        case 'Email': {
            break;
        }
        case 'In-App Messaging': {
            return chain.wait(`Run "amplify push" to update the channel in the cloud`).runAsync();
        }
        default:
            break;
    }
    return chain.wait(`The ${channel} channel has been successfully enabled`).sendEof().runAsync();
});
exports.addNotificationChannel = addNotificationChannel;
//# sourceMappingURL=notifications.js.map