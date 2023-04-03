"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHashedIdentifier = exports.encryptKey = exports.encryptBuffer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const reporter_apis_1 = require("./reporter-apis");
const encryptBuffer = async (text, passKey) => {
    const masterKey = Buffer.from(passKey, 'utf-8');
    const iv = crypto_1.default.randomBytes(16);
    const salt = crypto_1.default.randomBytes(64);
    const key = crypto_1.default.pbkdf2Sync(masterKey, salt, 2145, 32, 'sha512');
    const cipher = crypto_1.default.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};
exports.encryptBuffer = encryptBuffer;
const encryptKey = async (key) => {
    const publicKey = await (0, reporter_apis_1.getPublicKey)();
    return crypto_1.default
        .publicEncrypt({
        key: publicKey,
        padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
    }, Buffer.from(key))
        .toString('base64');
};
exports.encryptKey = encryptKey;
const createHashedIdentifier = (projectName, appId, envName) => {
    const projectIdentifier = crypto_1.default.createHash('md5').update(`${projectName}-${appId}`).digest('hex');
    const projectEnvIdentifier = crypto_1.default.createHash('md5').update(`${projectName}-${appId}-${envName}`).digest('hex');
    return { projectIdentifier, projectEnvIdentifier };
};
exports.createHashedIdentifier = createHashedIdentifier;
//# sourceMappingURL=encryption-helpers.js.map