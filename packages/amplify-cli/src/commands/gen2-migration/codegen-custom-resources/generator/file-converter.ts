import { promises as fs } from 'fs';
import * as path from 'path';

export class FileConverter {
  /**
   * Converts cdk-stack.ts files to resource.ts in custom resources
   * @param customResourcesPath - Path to custom resources directory
   * @param resourceFilter - Optional list of resource names to process (processes all if not provided)
   */
  async convertCdkStackToResource(customResourcesPath: string, resourceFilter?: string[]): Promise<void> {
    try {
      const resources = await fs.readdir(customResourcesPath);

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];

        // Skip if filter provided and resource not in filter
        if (resourceFilter && !resourceFilter.includes(resource)) {
          continue;
        }

        const resourceDir = path.join(customResourcesPath, resource);
        const stat = await fs.stat(resourceDir);

        if (stat.isDirectory()) {
          const cdkStackPath = path.join(resourceDir, 'cdk-stack.ts');
          const resourceFilePath = path.join(resourceDir, 'resource.ts');

          try {
            await fs.access(cdkStackPath);
            await fs.rename(cdkStackPath, resourceFilePath);
          } catch {
            // cdk-stack.ts doesn't exist, skip
          }
        }
      }
    } catch {
      // customResourcesPath doesn't exist
    }
  }

  /**
   * Removes build artifacts from custom resources
   */
  async removeBuildArtifacts(customResourcesPath: string): Promise<void> {
    const artifactsToRemove = ['build', 'node_modules', '.npmrc', 'yarn.lock', 'tsconfig.json'];

    try {
      const resources = await fs.readdir(customResourcesPath);

      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        const resourceDir = path.join(customResourcesPath, resource);
        const stat = await fs.stat(resourceDir);

        if (stat.isDirectory()) {
          for (let j = 0; j < artifactsToRemove.length; j++) {
            const artifact = artifactsToRemove[j];
            const artifactPath = path.join(resourceDir, artifact);
            try {
              await fs.rm(artifactPath, { recursive: true, force: true });
            } catch {
              // Artifact doesn't exist, skip
            }
          }
        }
      }
    } catch {
      // customResourcesPath doesn't exist
    }
  }
}
