import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from './generator';
import { AmplifyMigrationOperation } from '../_operation';
import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';

const GEN1_COMMAND = '- amplifyPush --simple';
const GEN2_INSTALL_COMMAND = '- npm ci --cache .npm --prefer-offline';
const GEN2_COMMAND = '- npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';
const GEN2_REPLACE_STRING = `${GEN2_INSTALL_COMMAND}\n${' '.repeat(8)}${GEN2_COMMAND}`;

/**
 * Updates or creates the amplify.yml buildspec to replace Gen1 commands
 * with Gen2 pipeline-deploy commands.
 */
export class AmplifyYmlGenerator implements Generator {
  private readonly amplifyClient: AmplifyClient;
  private readonly appId: string;

  constructor(amplifyClient: AmplifyClient, appId: string) {
    this.amplifyClient = amplifyClient;
    this.appId = appId;
  }

  async plan(): Promise<AmplifyMigrationOperation[]> {
    return [
      {
        describe: async () => ['Update amplify.yml with Gen2 build commands'],
        execute: async () => {
          const app = await this.amplifyClient.send(new GetAppCommand({ appId: this.appId }));
          const buildSpec = app?.app?.buildSpec;
          if (!buildSpec) return;

          const amplifyYmlPath = path.join(process.cwd(), 'amplify.yml');
          try {
            const existing = await fs.readFile(amplifyYmlPath, 'utf-8');
            const updated = existing.replace(GEN1_COMMAND, GEN2_REPLACE_STRING);
            await fs.writeFile(amplifyYmlPath, updated, 'utf-8');
          } catch {
            // File doesn't exist — write the updated buildspec
            const updatedBuildSpec = buildSpec.replace(GEN1_COMMAND, GEN2_REPLACE_STRING);
            await fs.writeFile(amplifyYmlPath, updatedBuildSpec, 'utf-8');
          }
        },
      },
    ];
  }
}
