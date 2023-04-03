"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinpointName = void 0;
class PinpointName {
}
exports.PinpointName = PinpointName;
PinpointName.extractResourceName = (pinpointAppName, envName) => pinpointAppName.replace(PinpointName.getEnvTagPattern(envName), '');
PinpointName.generatePinpointAppName = (resourceName, envName) => resourceName + PinpointName.getEnvTagPattern(envName);
PinpointName.getEnvTagPattern = (envName) => (envName === 'NONE' ? '' : `-${envName}`);
//# sourceMappingURL=pinpoint-name.js.map