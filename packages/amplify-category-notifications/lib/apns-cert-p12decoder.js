"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const run = (info) => {
    const { P12FilePath, P12FilePassword } = info;
    const pemFileContent = getPemFileContent(P12FilePath, P12FilePassword);
    const Certificate = getCertificate(pemFileContent);
    let PrivateKey = getPrivateKey(pemFileContent);
    if (!PrivateKey) {
        PrivateKey = getRSAPrivateKey(pemFileContent);
    }
    if (!PrivateKey) {
        PrivateKey = getEncryptedPrivateKey(pemFileContent);
    }
    if (!Certificate) {
        throw new amplify_cli_core_1.AmplifyError('OpenSslCertificateError', {
            message: 'OpenSSL can not extract the Certificate from the p12 file',
            resolution: 'Check the p12 file and password and try again',
        });
    }
    if (!PrivateKey) {
        throw new amplify_cli_core_1.AmplifyError('OpenSslCertificateError', {
            message: 'OpenSSL can not extract the Private Key from the p12 file',
            resolution: 'Check the p12 file and password and try again',
        });
    }
    return {
        Certificate,
        PrivateKey,
    };
};
exports.run = run;
const getPemFileContent = (filePath, filePassword) => {
    const outputFilePath = path_1.default.join(os_1.default.tmpdir(), 'temp.pem');
    const cmd = `openssl pkcs12 -in ${filePath} -out ${outputFilePath} -nodes -passin pass:${filePassword}`;
    (0, child_process_1.execSync)(cmd);
    const content = fs_extra_1.default.readFileSync(outputFilePath, 'utf8');
    fs_extra_1.default.removeSync(outputFilePath);
    return content;
};
const getCertificate = (pemFileContent) => {
    let certificate;
    const beginMark = '-----BEGIN CERTIFICATE-----';
    const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
    if (beginIndex > -1) {
        const endMark = '-----END CERTIFICATE-----';
        const endIndex = pemFileContent.indexOf(endMark, beginIndex);
        if (endIndex > -1) {
            certificate = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
            return beginMark + os_1.default.EOL + certificate + os_1.default.EOL + endMark;
        }
    }
    return certificate;
};
const getPrivateKey = (pemFileContent) => {
    let privateKey;
    const beginMark = '-----BEGIN PRIVATE KEY-----';
    const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
    if (beginIndex > -1) {
        const endMark = '-----END PRIVATE KEY-----';
        const endIndex = pemFileContent.indexOf(endMark, beginIndex);
        if (endIndex > -1) {
            privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
            return beginMark + os_1.default.EOL + privateKey + os_1.default.EOL + endMark;
        }
    }
    return privateKey;
};
const getRSAPrivateKey = (pemFileContent) => {
    let privateKey;
    const beginMark = '-----BEGIN RSA PRIVATE KEY-----';
    const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
    if (beginIndex > -1) {
        const endMark = '-----END RSA PRIVATE KEY-----';
        const endIndex = pemFileContent.indexOf(endMark, beginIndex);
        if (endIndex > -1) {
            privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
            return beginMark + os_1.default.EOL + privateKey + os_1.default.EOL + endMark;
        }
    }
    return privateKey;
};
const getEncryptedPrivateKey = (pemFileContent) => {
    let privateKey;
    const beginMark = '-----BEGIN ENCRYPTED PRIVATE KEY-----';
    const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
    if (beginIndex > -1) {
        const endMark = '-----END ENCRYPTED PRIVATE KEY-----';
        const endIndex = pemFileContent.indexOf(endMark, beginIndex);
        if (endIndex > -1) {
            privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
            return beginMark + os_1.default.EOL + privateKey + os_1.default.EOL + endMark;
        }
    }
    return privateKey;
};
//# sourceMappingURL=apns-cert-p12decoder.js.map