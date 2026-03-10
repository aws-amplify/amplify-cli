import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';

const GEN2_GITIGNORE_ENTRIES = ['.amplify', 'amplify_outputs*', 'amplifyconfiguration*', 'aws-exports*', 'node_modules', 'build', 'dist'];

/**
 * Updates .gitignore: removes the Gen1 amplify block and adds Gen2 entries.
 */
export class GitIgnoreGenerator implements Generator {
  public async plan(): Promise<AmplifyMigrationOperation[]> {
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

          // Remove Gen1 amplify-do-not-edit block
          const gen1BlockRegex = /#amplify-do-not-edit-begin[\s\S]*#amplify-do-not-edit-end/g;
          content = content.replace(gen1BlockRegex, '');

          // Add Gen2 entries
          if (!content.includes('.amplify')) {
            content = `${content}\n# amplify\n.amplify`;
          }
          for (const entry of GEN2_GITIGNORE_ENTRIES.slice(1)) {
            if (!content.includes(entry)) {
              content = `${content}\n${entry}`;
            }
          }

          // Remove empty lines and write
          content = content.replace(/^\s*[\r\n]/gm, '');
          await fs.writeFile(gitignorePath, `${content}\n`, 'utf-8');
        },
      },
    ];
  }
}
