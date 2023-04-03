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
exports.ResolverOverrides = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class ResolverOverrides {
    constructor(_rootFolder, _foldersToWatch = ['resolvers', 'pipelineFunctions', 'functions'], fileExtensions = ['.vtl']) {
        this._rootFolder = _rootFolder;
        this._foldersToWatch = _foldersToWatch;
        this.fileExtensions = fileExtensions;
        this.overrides = new Set();
        this.contentMap = new Map();
        this.start();
    }
    start() {
        this._foldersToWatch
            .map((folder) => path.join(this._rootFolder, folder))
            .forEach((folder) => {
            if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
                fs.readdirSync(folder)
                    .map((f) => path.join(folder, f))
                    .filter((f) => this.isTemplateFile(f))
                    .forEach((f) => {
                    this.updateContentMap(f);
                });
            }
        });
    }
    onFileChange(filePath) {
        if (!this.isTemplateFile(filePath)) {
            return false;
        }
        return this.updateContentMap(filePath);
    }
    sync(transformerResolvers, userOverriddenSlots) {
        const filesToWrite = new Map();
        const filesToDelete = new Set();
        const result = transformerResolvers.map((resolver) => {
            const r = { ...resolver };
            const normalizedPath = path.normalize(resolver.path);
            if (this.overrides.has(normalizedPath)) {
                const overriddenContent = this.contentMap.get(normalizedPath);
                if (overriddenContent === resolver.content && !userOverriddenSlots.includes(path.basename(normalizedPath))) {
                    this.overrides.delete(normalizedPath);
                }
                else {
                    r.content = overriddenContent;
                }
            }
            else {
                if (this.contentMap.has(normalizedPath)) {
                    const diskFileContent = this.contentMap.get(normalizedPath);
                    if (diskFileContent !== resolver.content) {
                        filesToWrite.set(normalizedPath, resolver.content);
                    }
                }
                else {
                    filesToWrite.set(normalizedPath, resolver.content);
                }
                r.content = resolver.content;
            }
            return r;
        });
        const generatedResolverPath = transformerResolvers.map((r) => r.path);
        this.contentMap.forEach((val, resolverPath) => {
            if (!this.overrides.has(resolverPath) && !generatedResolverPath.includes(resolverPath)) {
                filesToDelete.add(resolverPath);
            }
        });
        const resolversCreatedByTransformer = result.map((r) => r.path);
        const customResolverTemplates = Array.from(this.overrides.values()).filter((o) => !resolversCreatedByTransformer.includes(o));
        customResolverTemplates.forEach((templateName) => {
            result.push({
                path: templateName,
                content: this.contentMap.get(templateName),
            });
        });
        filesToWrite.forEach((content, filePath) => {
            this.contentMap.set(filePath, content);
            const abPath = this.getAbsPath(filePath);
            fs.ensureFileSync(abPath);
            fs.writeFileSync(abPath, content);
        });
        filesToDelete.forEach((filePath) => {
            this.contentMap.delete(filePath);
            fs.unlinkSync(this.getAbsPath(filePath));
        });
        return result;
    }
    stop() {
        this.contentMap.forEach((val, filePath) => {
            if (!this.overrides.has(filePath)) {
                fs.unlinkSync(this.getAbsPath(filePath));
            }
        });
    }
    isTemplateFile(filePath, isDelete = false) {
        if (!this.fileExtensions.includes(path.extname(filePath))) {
            return false;
        }
        const isInWatchedDir = this._foldersToWatch.some((folder) => {
            const absFolder = path.join(this._rootFolder, folder);
            return filePath.includes(absFolder);
        });
        if (!isInWatchedDir) {
            return false;
        }
        if (isDelete) {
            return true;
        }
        if (fs.lstatSync(filePath).isFile()) {
            return true;
        }
        return false;
    }
    updateContentMap(filePath) {
        const relativePath = this.getRelativePath(filePath);
        const content = fs.readFileSync(filePath).toString();
        if (content.trim() !== '' && this.contentMap.get(relativePath) !== content) {
            this.contentMap.set(relativePath, content);
            this.overrides.add(relativePath);
            return true;
        }
        return false;
    }
    getRelativePath(filePath) {
        return path.relative(this.resolverTemplateRoot, filePath);
    }
    getAbsPath(filename) {
        return path.normalize(path.join(this.resolverTemplateRoot, filename));
    }
    onAdd(path) {
        return this.onFileChange(path);
    }
    onChange(path) {
        return this.onFileChange(path);
    }
    onUnlink(path) {
        const relativePath = this.getRelativePath(path);
        this.contentMap.delete(relativePath);
        if (this.overrides.has(relativePath)) {
            this.overrides.delete(relativePath);
            return true;
        }
        return false;
    }
    get resolverTemplateRoot() {
        return this._rootFolder;
    }
}
exports.ResolverOverrides = ResolverOverrides;
//# sourceMappingURL=resolver-overrides.js.map