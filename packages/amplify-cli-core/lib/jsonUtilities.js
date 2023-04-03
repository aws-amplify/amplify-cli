"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.JSONUtilities = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const jsonReader = __importStar(require("hjson"));
class JSONUtilities {
}
exports.JSONUtilities = JSONUtilities;
JSONUtilities.readJson = (fileName, options) => {
    if (!fileName) {
        throw new Error(`'fileName' argument missing`);
    }
    const mergedOptions = {
        throwIfNotExist: true,
        preserveComments: false,
        ...options,
    };
    if (!fs.existsSync(fileName)) {
        if (mergedOptions.throwIfNotExist) {
            throw new Error(`File at path: '${fileName}' does not exist`);
        }
        else {
            return undefined;
        }
    }
    const content = fs.readFileSync(fileName, 'utf8');
    const data = JSONUtilities.parse(content, {
        preserveComments: mergedOptions.preserveComments,
    });
    return data;
};
JSONUtilities.writeJson = (fileName, data, options) => {
    if (!fileName) {
        throw new Error(`'fileName' argument missing`);
    }
    if (!data) {
        throw new Error(`'data' argument missing`);
    }
    const mergedOptions = {
        minify: false,
        secureFile: false,
        ...options,
    };
    const jsonString = JSONUtilities.stringify(data, {
        minify: mergedOptions.minify,
        orderedKeys: mergedOptions.orderedKeys,
    });
    const dirPath = path.dirname(fileName);
    fs.ensureDirSync(dirPath);
    const writeFileOptions = { encoding: 'utf8', mode: options === null || options === void 0 ? void 0 : options.mode };
    if (mergedOptions.secureFile) {
        writeFileOptions.mode = 0o600;
    }
    fs.writeFileSync(fileName, jsonString, writeFileOptions);
};
JSONUtilities.parse = (jsonString, options) => {
    if (jsonString === undefined || (typeof jsonString === 'string' && jsonString.trim().length === 0)) {
        throw new Error("'jsonString' argument missing or empty");
    }
    const mergedOptions = {
        preserveComments: false,
        ...options,
    };
    let data;
    if (typeof jsonString === 'string') {
        let cleanString = jsonString;
        if (cleanString.charCodeAt(0) === 0xfeff) {
            cleanString = cleanString.slice(1);
        }
        data = jsonReader.parse(cleanString, {
            keepWsc: mergedOptions.preserveComments,
        });
    }
    else {
        return jsonString;
    }
    return data;
};
JSONUtilities.stringify = (data, options) => {
    if (!data) {
        throw new Error("'data' argument missing");
    }
    const mergedOptions = {
        minify: false,
        orderedKeys: false,
        ...options,
    };
    let jsonString = '';
    let sortKeys;
    if (mergedOptions.orderedKeys) {
        const allKeys = [];
        JSON.stringify(data, (k, v) => {
            allKeys.push(k);
            return v;
        });
        sortKeys = allKeys.sort();
    }
    if (mergedOptions.minify) {
        jsonString = JSON.stringify(data, sortKeys);
    }
    else {
        jsonString = JSON.stringify(data, sortKeys, 2);
    }
    return jsonString;
};
//# sourceMappingURL=jsonUtilities.js.map