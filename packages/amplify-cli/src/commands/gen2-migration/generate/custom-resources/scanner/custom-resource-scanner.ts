import * as fs from 'fs-extra';
import { existsSync, promises as fsPromises } from 'fs';
import * as path from 'path';
import { CustomResource } from '../types';

export class CustomResourceScanner {
  /**
   * Scans amplify/backend/custom/ directory for all custom resources
   */
  async scanCustomResources(projectRoot: string): Promise<CustomResource[]> {
    const customDir = path.join(projectRoot, 'amplify', 'backend', 'custom');

    if (!existsSync(customDir)) {
      return [];
    }

    const resources: CustomResource[] = [];
    const entries = await fsPromises.readdir(customDir);

    for (const entryName of entries) {
      const entryPath = path.join(customDir, entryName);
      const stat = await fsPromises.stat(entryPath);

      if (stat.isDirectory()) {
        const resourcePath = path.join(customDir, entryName);
        const cdkStackPath = path.join(resourcePath, 'cdk-stack.ts');

        if (existsSync(cdkStackPath)) {
          resources.push({
            name: entryName,
            path: resourcePath,
            cdkStackPath,
          });
        }
      }
    }

    return resources;
  }
}
