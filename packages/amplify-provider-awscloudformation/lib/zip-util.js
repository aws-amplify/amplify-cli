"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractZip = exports.downloadZip = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const aws_logger_1 = require("./utils/aws-logger");
const logger = (0, aws_logger_1.fileLogger)('zip-util');
const downloadZip = async (s3, tempDir, zipFileName, envName) => {
    const log = logger('downloadZip.s3.getFile', [{ Key: zipFileName }, envName]);
    log();
    const objectResult = await s3.getFile({ Key: zipFileName }, envName);
    fs_extra_1.default.ensureDirSync(tempDir);
    const buff = Buffer.from(objectResult);
    const tempFile = `${tempDir}/${zipFileName}`;
    await fs_extra_1.default.writeFile(tempFile, buff);
    return tempFile;
};
exports.downloadZip = downloadZip;
const extractZip = async (tempDir, zipFile) => {
    try {
        const fileNameExt = path_1.default.basename(zipFile);
        const filename = fileNameExt.split('.')[0];
        const unzippedDir = path_1.default.join(tempDir, filename);
        await (0, extract_zip_1.default)(zipFile, { dir: unzippedDir });
        return unzippedDir;
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyFault('ZipExtractFault', {
            message: 'Failed to extract zip file: ',
            details: e.message,
        }, e);
    }
};
exports.extractZip = extractZip;
//# sourceMappingURL=zip-util.js.map