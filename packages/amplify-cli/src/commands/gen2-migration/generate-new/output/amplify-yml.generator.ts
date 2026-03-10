import path from 'node:path';
import fs from 'node:fs/promises';
import * as yaml from 'yaml';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { Gen1App } from '../input/gen1-app';
import { fileOrDirectoryExists } from '../input/file-exists';

const GEN1_COMMAND = '- amplifyPush --simple';
const GEN2_INSTALL_COMMAND = '- npm ci --cache .npm --prefer-offline';
const GEN2_COMMAND = '- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';
const GEN2_REPLACE_STRING = `${GEN2_INSTALL_COMMAND}\n${' '.repeat(8)}${GEN2_COMMAND}`;

/**
 * Updates or creates the amplify.yml buildspec to replace Gen1 commands
 * with Gen2 pipeline-deploy commands.
 *
 * Parses the YAML and re-serializes it (normalizing quote style) before
 * performing the Gen1→Gen2 command substitution.
 */
export class AmplifyYmlGenerator implements Generator {
  private readonly gen1App: Gen1App;

  public constructor(gen1App: Gen1App) {
    this.gen1App = gen1App;
  }

  /**
   * Plans the amplify.yml update operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const amplifyYmlPath = path.join(process.cwd(), 'amplify.yml');
    const localFileExists = await fileOrDirectoryExists(amplifyYmlPath);

    return [
      {
        describe: async () => [localFileExists ? 'Update amplify.yml with Gen2 build commands' : 'Generate amplify.yml'],
        execute: async () => {
          let parsed: unknown;
          let fromExistingSource = false;

          if (localFileExists) {
            const existing = await fs.readFile(amplifyYmlPath, 'utf-8');
            parsed = yaml.parse(existing);
            fromExistingSource = true;
          } else {
            // File doesn't exist — try the remote buildspec
            const buildSpec = await this.gen1App.aws.fetchAppBuildSpec(this.gen1App.appId);
            if (buildSpec) {
              parsed = yaml.parse(buildSpec);
              fromExistingSource = true;
            }
          }

          if (!parsed) {
            // No local file and no remote buildspec — create a default
            // backend-only spec with Gen2 commands already in place.
            parsed = {
              version: 1,
              backend: {
                phases: {
                  build: {
                    commands: [
                      '# Execute Amplify CLI with the helper script',
                      'npm ci --cache .npm --prefer-offline',
                      'npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID',
                    ],
                  },
                },
              },
              frontend: {
                phases: {
                  build: {
                    commands: ['mkdir dist', 'touch dist/index.html'],
                  },
                },
                artifacts: {
                  baseDirectory: 'dist',
                  files: ['**/*'],
                },
              },
            };
          }

          let content = yaml.stringify(parsed);
          if (fromExistingSource) {
            content = content.replace(new RegExp(GEN1_COMMAND, 'g'), GEN2_REPLACE_STRING);
          }
          await fs.writeFile(amplifyYmlPath, content, 'utf-8');
        },
      },
    ];
  }
}
