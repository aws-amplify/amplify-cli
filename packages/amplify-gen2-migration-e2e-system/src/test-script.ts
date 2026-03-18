/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// import execa from 'execa';
// import fs from 'fs';
import { Gen2MigrationExecutor } from './core';
import { Logger } from './utils/logger';
import { LogLevel } from './types';

const logger = new Logger(LogLevel.DEBUG);
const gen2MigrationExecutor = new Gen2MigrationExecutor(logger);

// function getAmplifyCliPath(): string {
//   const amplifyPath = process.env.AMPLIFY_PATH;
//   if (amplifyPath && fs.existsSync(amplifyPath)) {
//     return amplifyPath;
//   }
//   return process.platform === 'win32' ? 'amplify.exe' : 'amplify';
// }

// async function amplifyPush(): Promise<void> {
//   const amplifyPath = getAmplifyCliPath();
//   console.log(`Using amplify CLI at: ${amplifyPath}`);
//   const originalCwd = process.cwd();

//   process.chdir('/private/var/folders/zy/p394g9w14sbbfwj23q2pd3f00000gq/T/amplify-migration-output/260225145301906ards'); // targetAppPath);
//   try {
//     const result = await execa(amplifyPath, ['push', '--yes', '--debug'], {
//       cwd: '/private/var/folders/zy/p394g9w14sbbfwj23q2pd3f00000gq/T/amplify-migration-output/260225145301906ards', // targetAppPath,
//       env: {},
//     });

//     if (result.exitCode !== 0) {
//       throw new Error(`amplify push failed with exit code ${result.exitCode}`);
//     }
//   } finally {
//     process.chdir(originalCwd);
//   }
// }

// void amplifyPush();

// replace with directory where your amplify app was deployed
// const appPath = '/var/folders/zy/p394g9w14sbbfwj23q2pd3f00000gq/T/amplify-gen2-migration-e2e-system/output-apps/260313115158387ards';
const appPath = '/var/folders/zy/p394g9w14sbbfwj23q2pd3f00000gq/T/amplify-gen2-migration-e2e-system/output-apps/260317102917905ards';
void gen2MigrationExecutor.runPreDeploymentWorkflow(appPath);

// void gen2MigrationExecutor.runPostDeploymentWorkflow(appPath);
