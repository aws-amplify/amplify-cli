"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = exports.functionTemplateContributorFactory = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const pathToTemplateFiles = `${__dirname}/../resources/hello-world`;
const functionTemplateContributorFactory = () => {
    return {
        contribute: (request) => {
            const selection = request.selection;
            if (selection !== 'hello-world') {
                throw new Error(`Unknown python template selection ${selection}`);
            }
            return helloWorld();
        },
    };
};
exports.functionTemplateContributorFactory = functionTemplateContributorFactory;
function helloWorld() {
    const files = fs_extra_1.default.readdirSync(pathToTemplateFiles);
    return Promise.resolve({
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            destMap: {
                'index.py': 'src/index.py',
                'event.json': 'src/event.json',
                'setup.py': 'src/setup.py',
            },
            defaultEditorFile: 'src/index.py',
        },
    });
}
exports.helloWorld = helloWorld;
//# sourceMappingURL=index.js.map