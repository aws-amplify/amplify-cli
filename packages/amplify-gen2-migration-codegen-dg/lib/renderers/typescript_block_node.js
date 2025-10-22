"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptNodeArrayRenderer = void 0;
const typescript_1 = __importDefault(require("typescript"));
class TypescriptNodeArrayRenderer {
    constructor(blockCreator, writer) {
        this.blockCreator = blockCreator;
        this.writer = writer;
        this.render = async () => {
            const block = await this.blockCreator();
            const source = this.printer.printList(typescript_1.default.ListFormat.MultiLine, block, this.sourceFile);
            await this.writer(source);
        };
        this.printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
        this.sourceFile = typescript_1.default.createSourceFile('output.ts', '', typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TS);
    }
}
exports.TypescriptNodeArrayRenderer = TypescriptNodeArrayRenderer;
//# sourceMappingURL=typescript_block_node.js.map