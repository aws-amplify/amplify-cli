"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRegPendingDelete = exports.deleteOldVersion = void 0;
const fs = __importStar(require("fs-extra"));
const execa_1 = require("execa");
const win_constants_1 = require("./win-constants");
const regPath = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager';
const regKey = 'PendingFileRenameOperations';
const regPreamble = `Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager]
"${regKey}"=hex(7):`;
const deleteOldVersion = () => {
    if (process.platform.startsWith('win') && fs.existsSync(win_constants_1.oldVersionPath)) {
        try {
            fs.removeSync(win_constants_1.oldVersionPath);
        }
        catch (err) {
            console.warn(`Failed to clean up previous CLI installation at [${win_constants_1.oldVersionPath}].`);
            console.log(err);
            console.warn('Make sure this file is not open anywhere else.');
        }
    }
};
exports.deleteOldVersion = deleteOldVersion;
const setRegPendingDelete = async () => {
    if (!process.platform.startsWith('win'))
        return;
    let regQueryOutput = '';
    try {
        ({ stdout: regQueryOutput } = await (0, execa_1.command)(`reg query "${regPath}" /v ${regKey}`, { shell: 'cmd.exe' }));
    }
    catch (err) {
    }
    const startIdx = Math.max(0, regQueryOutput.indexOf('\\??'));
    const currentPaths = regQueryOutput
        .slice(startIdx)
        .trim()
        .split('\\0')
        .filter((p) => !!p);
    const newPaths = currentPaths.concat(`\\??\\${win_constants_1.pendingDeletePath}`);
    const newHex = newPaths
        .map(strToLittleEndianHex)
        .map((hexArr) => hexArr.join(','))
        .join(',00,00,00,00,')
        .concat(',00,00,00,00,00,00');
    const regContent = `${regPreamble}${newHex}`;
    await fs.writeFile(win_constants_1.tmpRegPath, regContent);
    await (0, execa_1.command)(`reg import "${win_constants_1.tmpRegPath}"`, { shell: 'cmd.exe' });
    await fs.remove(win_constants_1.tmpRegPath);
};
exports.setRegPendingDelete = setRegPendingDelete;
const strToLittleEndianHex = (str) => {
    const hexArr = [];
    for (let i = 0; i < str.length; i++) {
        const hexCode = str.charCodeAt(i).toString(16);
        switch (hexCode.length) {
            case 1:
                hexArr.push(`0${hexCode}`);
                hexArr.push('00');
                break;
            case 2:
                hexArr.push(hexCode);
                hexArr.push('00');
                break;
            case 3:
                hexArr.push(hexCode.slice(1));
                hexArr.push(`0${hexCode[0]}`);
                break;
            case 4:
                hexArr.push(hexCode.slice(2));
                hexArr.push(hexCode.slice(0, 2));
                break;
            default:
                throw new Error(`Could not convert hex code ${hexCode} into 16 bit little endian format`);
        }
    }
    return hexArr;
};
//# sourceMappingURL=win-utils.js.map