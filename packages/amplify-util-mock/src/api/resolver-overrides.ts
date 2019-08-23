import * as fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';

export class ResolverOverrides {
  private overrides: Set<string>;
  private contentMap: Map<string, string>;

  constructor(
    private _rootFolder: string,
    private _foldersToWatch: string[] = ['resolvers', 'pipelineFunctions'],
    private fileExtensions: string[] = ['.vtl']
  ) {
    this.overrides = new Set();
    this.contentMap = new Map();
    this.start();
  }

  start() {
    this._foldersToWatch
      .map(folder => path.join(this._rootFolder, folder))
      .forEach(folder => {
        if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
          fs.readdirSync(folder)
            .map(f => path.join(folder, f))
            .filter(f => this.isTemplateFile(f))
            .forEach(f => {
              this.updateContentMap(f);
            });
        }
      });
  }

  onFileChange(filePath: string) {
    if (!this.isTemplateFile(filePath)) {
      return false;
    }
    return this.updateContentMap(filePath);
  }

  sync(transformerResolvers: { path: string; content: string }[]) {
    const filesToWrite: Map<string, string> = new Map();
    const filesToDelete: Set<string> = new Set();
    const result: {
      path: string;
      content: string;
    }[] = transformerResolvers.map(resolver => {
      const r = { ...resolver };
      const normalizedPath = path.normalize(resolver.path);
      // Step 1: Check if the file is in the override map and if it really is
      // different from transformer generated file or its here because it was not
      // deleted from last execution
      if (this.overrides.has(normalizedPath)) {
        const overriddenContent = this.contentMap.get(normalizedPath);
        if (overriddenContent === resolver.content) {
          this.overrides.delete(normalizedPath);
        } else {
          r.content = overriddenContent;
        }
      } else {
        // Step 2. The file is not in content map. Its a new created by transformer
        if (this.contentMap.has(normalizedPath)) {
          // existing file, not a newly created file
          const diskFileContent = this.contentMap.get(normalizedPath);
          if (diskFileContent !== resolver.content) {
            filesToWrite.set(normalizedPath, resolver.content);
          }
        } else {
          // new resolver created by transformer
          filesToWrite.set(normalizedPath, resolver.content);
        }
        r.content = resolver.content;
      }
      return r;
    });

    // Populate the list of files that needs to be deleted
    const generatedResolverPath = transformerResolvers.map(r => r.path);
    this.contentMap.forEach((val, resolverPath) => {
      if (!this.overrides.has(resolverPath) && !generatedResolverPath.includes(resolverPath)) {
        filesToDelete.add(resolverPath);
      }
    });

    // Files that are in the disk used by resolvers created by custom stack will exist in resolver folder
    //  include them in the resolver output
    const resolversCreatedByTransformer = result.map(r => r.path);
    const customResolverTemplates = Array.from(this.overrides.values()).filter(
      o => !resolversCreatedByTransformer.includes(o)
    );
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
      const abPath = this.getAbsPath(filePath);
      fs.ensureFileSync(abPath);
      fs.writeFileSync(abPath, content);
    });

    // Delete the files that are no longer needed
    filesToDelete.forEach(filePath => {
      this.contentMap.delete(filePath);
      fs.unlinkSync(this.getAbsPath(filePath));
    });
    return result;
  }
  /**
   * Stop synchronizing resolver content. This will delete all the resolvers except for
   * the ones which are not overridden
   */
  stop() {
    this.contentMap.forEach((val, filePath) => {
      if (!this.overrides.has(filePath)) {
        fs.unlinkSync(this.getAbsPath(filePath));
      }
    });
  }

  isTemplateFile(filePath: string): boolean {
    if (!this.fileExtensions.includes(path.extname(filePath))) {
      return false;
    }
    const isInWatchedDir = this._foldersToWatch.some(folder => {
      const absFolder = path.join(this._rootFolder, folder);
      return filePath.includes(absFolder);
    });
    if (!isInWatchedDir) {
      return false;
    }

    if (fs.lstatSync(filePath).isFile()) {
      return true;
    }
    return false;
  }

  private updateContentMap(filePath: string) {
    const relativePath = this.getRelativePath(filePath);
    const content = fs.readFileSync(filePath).toString();
    if (content.trim() !== '' && this.contentMap.get(relativePath) !== content) {
      this.contentMap.set(relativePath, content);
      this.overrides.add(relativePath);
      return true;
    }
    return false;
  }

  private getRelativePath(filePath: string) {
    return path.relative(this.resolverTemplateRoot, filePath);
  }
  private getAbsPath(filename: string) {
    return path.normalize(path.join(this.resolverTemplateRoot, filename));
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
  get resolverTemplateRoot() {
    return this._rootFolder;
  }
}
