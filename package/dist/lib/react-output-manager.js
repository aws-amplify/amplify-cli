"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactOutputManager = void 0;
/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
const codegen_ui_1 = require("./codegen-ui");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class ReactOutputManager extends codegen_ui_1.FrameworkOutputManager {
    async writeComponent(input, outputPath) {
        const { dir } = path_1.default.parse(outputPath);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir);
        }
        if (!input) {
            throw new Error('You must call renderComponent before you can save the file.');
        }
        const generatedNotice = `\
/***************************************************************************
 * The contents of this file were generated with Amplify FrontendManager.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

`;
        const generatedOutput = `${generatedNotice}${input}`;
        await fs_1.promises.writeFile(outputPath, generatedOutput);
    }
}
exports.ReactOutputManager = ReactOutputManager;
//# sourceMappingURL=react-output-manager.js.map