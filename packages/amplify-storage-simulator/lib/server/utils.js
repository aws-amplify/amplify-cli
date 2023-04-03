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
exports.stripChunkSignature = exports.checkFile = exports.parseUrl = void 0;
const path = __importStar(require("path"));
function parseUrl(request, route) {
    request.url = path.normalize(decodeURIComponent(request.url));
    const temp = request.url.split(route);
    request.params.path = '';
    if (request.query.prefix !== undefined) {
        request.params.path = request.query.prefix + '/';
    }
    if (temp[1] !== undefined) {
        request.params.path = path.normalize(path.join(request.params.path, temp[1].split('?')[0]));
    }
    else {
        request.params.path = path.normalize(path.join(request.params.path, temp[0].split('?')[0]));
    }
    if (request.params.path[0] == '/' || request.params.path[0] == '.') {
        request.params.path = request.params.path.substring(1);
    }
    if (process.platform === 'win32') {
        request.params.path = request.params.path.replace(/[<>:"|?*]/g, (match) => '%' + Buffer.from(match, 'utf8').toString('hex'));
    }
    if (request.method === 'GET') {
        if (request.query.prefix !== undefined || (temp[1] === '' && temp[0] === '') || (temp[1] === '/' && temp[0] === '')) {
            request.method = 'LIST';
        }
    }
}
exports.parseUrl = parseUrl;
function checkFile(file, prefix, delimiter) {
    if (delimiter === '') {
        return true;
    }
    else {
        const temp = file.split(String(prefix))[1].split(String(delimiter));
        if (temp[1] === undefined) {
            return false;
        }
        else {
            return true;
        }
    }
}
exports.checkFile = checkFile;
function stripChunkSignature(buf) {
    const str = buf.toString();
    const regex = /^[A-Fa-f0-9]+;chunk-signature=[0-9a-f]{64}/gm;
    let m;
    const offset = [];
    const chunk_size = [];
    const arr = [];
    while ((m = regex.exec(str)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        m.forEach((match) => {
            offset.push(Buffer.from(match).byteLength);
            const temp = match.split(';')[0];
            chunk_size.push(parseInt(temp, 16));
        });
    }
    let start = 0;
    if (offset.length === 0) {
        return buf;
    }
    for (let i = 0; i < offset.length - 1; i++) {
        start = start + offset[i] + 2;
        arr.push(buf.slice(start, start + chunk_size[i]));
        start = start + chunk_size[i] + 2;
    }
    return Buffer.concat(arr);
}
exports.stripChunkSignature = stripChunkSignature;
//# sourceMappingURL=utils.js.map