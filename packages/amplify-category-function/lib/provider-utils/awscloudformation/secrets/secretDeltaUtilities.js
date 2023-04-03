"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSetSecrets = exports.secretNamesToSecretDeltas = exports.getExistingSecrets = exports.hasExistingSecrets = void 0;
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const hasExistingSecrets = (secretDeltas) => Object.values(secretDeltas).filter(existingSecretDeltaPredicate).length > 0;
exports.hasExistingSecrets = hasExistingSecrets;
const getExistingSecrets = (secretDeltas) => Object.entries(secretDeltas)
    .filter(([_, delta]) => existingSecretDeltaPredicate(delta))
    .reduce((acc, [secretName, secretDelta]) => ({ ...acc, [secretName]: secretDelta }), {});
exports.getExistingSecrets = getExistingSecrets;
const secretNamesToSecretDeltas = (secretNames, delta = amplify_function_plugin_interface_1.retainSecret) => secretNames.reduce((acc, secretName) => ({ ...acc, [secretName]: delta }), {});
exports.secretNamesToSecretDeltas = secretNamesToSecretDeltas;
const hasSetSecrets = (secretDeltas) => Object.values(secretDeltas).filter((delta) => delta.operation === 'set').length > 0;
exports.hasSetSecrets = hasSetSecrets;
const existingSecretDeltaPredicate = (secretDelta) => secretDelta.operation !== amplify_function_plugin_interface_1.removeSecret.operation;
//# sourceMappingURL=secretDeltaUtilities.js.map