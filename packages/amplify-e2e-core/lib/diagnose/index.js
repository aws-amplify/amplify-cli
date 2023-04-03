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
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnoseSendReport_ZipFailed = exports.diagnoseSendReport = void 0;
const __1 = require("..");
/**
 * invokes cli for diagnose with --send-report flag
 * @param cwd current working directory
 * @returns void
 */
const diagnoseSendReport = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    let path = '';
    const callback = (text) => {
        const index = text.lastIndexOf(':');
        path = text.substring(index + 1).trim();
    };
    yield (0, __1.nspawn)((0, __1.getCLIPath)(), ['diagnose', '--send-report'], { cwd, stripColors: true })
        .wait(/Report saved/, callback)
        .wait(/Done/)
        .sendEof()
        .runAsync();
    return path;
});
exports.diagnoseSendReport = diagnoseSendReport;
/**
 * Send failing zipping
 * @param cwd current working directory
 */
const diagnoseSendReport_ZipFailed = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, __1.nspawn)((0, __1.getCLIPath)(), ['diagnose', '--send-report'], { cwd, stripColors: true })
        .wait('File at path:')
        .wait(/Creating Zip/)
        .sendEof()
        .runAsync();
});
exports.diagnoseSendReport_ZipFailed = diagnoseSendReport_ZipFailed;
//# sourceMappingURL=index.js.map