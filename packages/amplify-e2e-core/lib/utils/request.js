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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.post = void 0;
const https = require('https');
const node_fetch_1 = __importDefault(require("node-fetch"));
function post(_a) {
    var { body } = _a, options = __rest(_a, ["body"]);
    return new Promise((resolve, reject) => {
        const req = https.request(Object.assign({ method: 'POST' }, options), (res) => {
            const chunks = [];
            res.on('data', (data) => chunks.push(data));
            res.on('end', () => {
                let body = Buffer.concat(chunks);
                if (res.headers['content-type'].startsWith('application/json')) {
                    body = JSON.parse(body.toString());
                }
                resolve(body);
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}
exports.post = post;
function get(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, node_fetch_1.default)(url);
    });
}
exports.get = get;
//# sourceMappingURL=request.js.map