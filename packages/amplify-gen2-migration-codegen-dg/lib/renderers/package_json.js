"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRenderer = void 0;
class JsonRenderer {
    constructor(createJson, writeFile) {
        this.createJson = createJson;
        this.writeFile = writeFile;
        this.render = async () => {
            const packageJson = await this.createJson();
            await this.writeFile(JSON.stringify(packageJson, null, 2));
        };
    }
}
exports.JsonRenderer = JsonRenderer;
//# sourceMappingURL=package_json.js.map