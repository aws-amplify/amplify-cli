import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from './generator';
import { AmplifyMigrationOperation } from '../_operation';

const GEN2_GITIGNORE_ENTRIES = ['.amplify', 'amplify_outputs*', 'amplifyconfiguration*', 'aws-exports*', 'node_modules', 'build', 'dist'];

/**
 * Updates .gitignore with Gen2-specific entries.
 */
export class GitIgnoreGenerator implements Generator {
  async plan(): Promise<AmplifyMigrationOperation[]> {
    return [
      {
        describe: async () => ['Update .gitignore with Gen2 entries'],
        execute: async () => {
          const gitignorePath = path.join(process.cwd(), '.gitignore');
          let content = '';
          try {
            content = await fs.readFile(gitignorePath, 'utf-8');
          } catch {
            // File doesn't exist yet
          }

          const lines = content.split('\n');
          const toAdd = GEN2_GITIGNORE_ENTRIES.filter((entry) => !lines.includes(entry));

          if (toAdd.length > 0) {
            const suffix = content.endsWith('\n') ? '' : '\n';
            const updated = content + suffix + toAdd.join('\n') + '\n';
            await fs.writeFile(gitignorePath, updated, 'utf-8');
          }
        },
      },
    ];
  }
}
