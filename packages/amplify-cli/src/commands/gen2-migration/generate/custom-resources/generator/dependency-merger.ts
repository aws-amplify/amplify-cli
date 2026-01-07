import { promises as fs } from 'fs';
import * as path from 'path';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export class DependencyMerger {
  /**
   * Merges dependencies from custom resource package.json files into the Gen2 amplify/package.json
   */
  async mergeDependencies(customResourcesPath: string, targetPackageJsonPath: string): Promise<void> {
    const customDeps = await this.collectCustomDependencies(customResourcesPath);
    if (Object.keys(customDeps.dependencies).length === 0 && Object.keys(customDeps.devDependencies).length === 0) {
      return;
    }

    const targetPackageJson = await this.readPackageJson(targetPackageJsonPath);

    targetPackageJson.dependencies = this.mergeDeps(targetPackageJson.dependencies || {}, customDeps.dependencies);
    targetPackageJson.devDependencies = this.mergeDeps(targetPackageJson.devDependencies || {}, customDeps.devDependencies);

    await fs.writeFile(targetPackageJsonPath, JSON.stringify(targetPackageJson, null, 2) + '\n', 'utf-8');
  }

  private async collectCustomDependencies(customResourcesPath: string): Promise<PackageJson> {
    const collected: PackageJson = { dependencies: {}, devDependencies: {} };

    try {
      const resources = await fs.readdir(customResourcesPath);

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        const packageJsonPath = path.join(customResourcesPath, resource, 'package.json');
        try {
          const pkg = await this.readPackageJson(packageJsonPath);
          collected.dependencies = this.mergeDeps(collected.dependencies || {}, pkg.dependencies || {});
          collected.devDependencies = this.mergeDeps(collected.devDependencies || {}, pkg.devDependencies || {});
        } catch {
          // Skip if package.json doesn't exist for this resource
        }
      }
    } catch {
      // customResourcesPath doesn't exist
    }

    return collected;
  }

  private async readPackageJson(filePath: string): Promise<PackageJson> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  private mergeDeps(target: Record<string, string>, source: Record<string, string>): Record<string, string> {
    const merged = { ...target };

    const entries = Object.entries(source);
    for (let i = 0; i < entries.length; i++) {
      const [pkg, version] = entries[i];
      if (!merged[pkg]) {
        merged[pkg] = version;
      } else if (this.isNewerVersion(version, merged[pkg])) {
        merged[pkg] = version;
      }
    }

    return merged;
  }

  private isNewerVersion(v1: string, v2: string): boolean {
    const clean1 = v1.replace(/^[\^~]/, '');
    const clean2 = v2.replace(/^[\^~]/, '');

    const parts1 = clean1.split('.').map(Number);
    const parts2 = clean2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }

    return false;
  }
}
