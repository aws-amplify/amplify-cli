"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractApplePrivateKey = void 0;
const PRIVATE_KEY_REGEX = /(-+BEGINPRIVATEKEY-+)(.+[^-])(-+ENDPRIVATEKEY-+)/;
function extractApplePrivateKey(key) {
    let keyString = key.replace(/[\r\n\s]+/g, '');
    const matches = keyString.match(PRIVATE_KEY_REGEX);
    if (matches && matches[2]) {
        keyString = matches[2];
    }
    return keyString;
}
exports.extractApplePrivateKey = extractApplePrivateKey;
//# sourceMappingURL=extract-apple-private-key.js.map