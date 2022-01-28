import * as fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';

export class ResolverOverrides {
  private overrides: Set<string>;
  private contentMap: Map<string, string>;

  constructor(
    private _mockFolder: string,
    private _customFolder: string,
    private _foldersToWatch: string[] = ['resolvers', 'pipelineFunctions', 'functions'],
    private fileExtensions: string[] = ['.vtl'],
  ) {
    this.overrides = new Set();
    this.contentMap = new Map();
    this.start();
  }

  start() {
    this._foldersToWatch
      .map(folder => path.join(this._customFolder, folder))
      .forEach(folder => {
        if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
          fs.readdirSync(folder)
            .map(f => path.join(folder, f))
            .filter(f => this.isTemplateFile(f))
            .forEach(f => {
              this.updateContentMap(f, this.getCustomResolverRelativePath(f));
            });
        }
      });
  }

  onFileChange(filePath: string) {
    if (!this.isTemplateFile(filePath)) {
      return false;
    }
    return this.updateContentMap(filePath, this.getRelativePath(filePath));
  }

  sync(transformerResolvers: { path: string; content: string }[]) {
    const filesToWrite: Map<string, string> = new Map();
    const result: {
      path: string;
      content: string;
    }[] = transformerResolvers.map(resolver => {
      const r = { ...resolver };
      const normalizedPath = path.normalize(resolver.path);
      // Step 1: Check if the file is in the override map
      if (this.overrides.has(normalizedPath)) {
        const overriddenContent = this.contentMap.get(normalizedPath);
        filesToWrite.set(normalizedPath, overriddenContent);
        r.content = overriddenContent;
      } else {
        filesToWrite.set(normalizedPath, resolver.content);
        r.content = resolver.content;
      }
      return r;
    });

    // Files that are in the disk used by resolvers created by custom stack will exist in resolver folder
    //  include them in the resolver output
    const resolversCreatedByTransformer = result.map(r => r.path);
    const customResolverTemplates = Array.from(this.overrides.values()).filter(o => !resolversCreatedByTransformer.includes(o));
    customResolverTemplates.forEach(templateName => {
      result.push({
        path: templateName,
        content: this.contentMap.get(templateName),
      });
    });

    // Write files to disk
    filesToWrite.forEach((content, filePath) => {
      // Update the content in the map
      this.contentMap.set(filePath, content);
      const abPath = this.getMockResolverAbsolutePath(filePath);
      fs.ensureFileSync(abPath);
      fs.writeFileSync(abPath, content);
    });

    return result;
  }
  /**
   * Stop synchronizing resolver content. This will delete all the resolvers except for
   * the ones which are not overridden
   */
  stop() {
    this.contentMap.forEach((content, filePath) => {
      if (this.overrides.has(filePath)) {
        const absolutePath = this.getCustomResolverAbsolutePath(filePath);
        fs.ensureFileSync(absolutePath);
        fs.writeFileSync(absolutePath, content);
      }
    });

    this.contentMap.forEach((_, filePath) => {
      fs.unlinkSync(this.getMockResolverAbsolutePath(filePath));
    });
  }

  isTemplateFile(filePath: string, isDelete: boolean = false): boolean {
    if (!this.fileExtensions.includes(path.extname(filePath))) {
      return false;
    }
    const isInWatchedDir = this._foldersToWatch.some(folder => {
      const absFolder = path.join(this._mockFolder, folder);
      return filePath.includes(absFolder);
    });

    const isCustomResolver = this._foldersToWatch.some(folder => {
      const absFolder = path.join(this._customFolder, folder);
      return filePath.includes(absFolder);
    });

    if (!isInWatchedDir && !isCustomResolver) {
      return false;
    }

    // When a file is unlinked, checking if the path is a file does not make sense
    if (isDelete) {
      return true;
    }

    if (fs.lstatSync(filePath).isFile()) {
      return true;
    }
    return false;
  }

  private updateContentMap(filePath: string, relativePath: string) {
    const content = fs.readFileSync(filePath).toString();
    if (content.trim() !== '' && this.contentMap.get(relativePath) !== content) {
      this.contentMap.set(relativePath, content);
      this.overrides.add(relativePath);
      return true;
    }
    return false;
  }

  private getCustomResolverRelativePath(filePath: string) {
    return path.relative(this.customResolverTemplateRoot, filePath);
  }

  private getRelativePath(filePath: string) {
    return path.relative(this.mockResolverTemplateRoot, filePath);
  }

  private getMockResolverAbsolutePath(filename: string) {
    return path.normalize(path.join(this.mockResolverTemplateRoot, filename));
  }

  private getCustomResolverAbsolutePath(filename: string) {
    return path.normalize(path.join(this.customResolverTemplateRoot, filename));
  }

  onAdd(path: string): boolean {
    return this.onFileChange(path);
  }

  onChange(path: string): boolean {
    return this.onFileChange(path);
  }
  onUnlink(path: string): boolean {
    const relativePath = this.getRelativePath(path);
    this.contentMap.delete(relativePath);
    if (this.overrides.has(relativePath)) {
      this.overrides.delete(relativePath);
      return true;
    }
    return false;
  }

  get mockResolverTemplateRoot() {
    return this._mockFolder;
  }

  get customResolverTemplateRoot() {
    return this._customFolder;
  }
}
