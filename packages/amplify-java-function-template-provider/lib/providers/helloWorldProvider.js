"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideHelloWorld = void 0;
const constants_1 = require("../utils/constants");
const path_1 = __importDefault(require("path"));
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda');
async function provideHelloWorld() {
    const files = [
        'hello-world/build.gradle.ejs',
        'hello-world/LambdaRequestHandler.java.ejs',
        'hello-world/RequestClass.java.ejs',
        'hello-world/ResponseClass.java.ejs',
        'hello-world/event.json',
    ];
    const handlerSource = path_1.default.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java');
    return {
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            defaultEditorFile: handlerSource,
            destMap: {
                'hello-world/build.gradle.ejs': path_1.default.join('build.gradle'),
                'hello-world/event.json': path_1.default.join('src', 'event.json'),
                'hello-world/LambdaRequestHandler.java.ejs': path_1.default.join('src', 'main', 'java', 'example', 'LambdaRequestHandler.java'),
                'hello-world/RequestClass.java.ejs': path_1.default.join('src', 'main', 'java', 'example', 'RequestClass.java'),
                'hello-world/ResponseClass.java.ejs': path_1.default.join('src', 'main', 'java', 'example', 'ResponseClass.java'),
            },
        },
    };
}
exports.provideHelloWorld = provideHelloWorld;
//# sourceMappingURL=helloWorldProvider.js.map