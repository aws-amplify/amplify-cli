import { $TSContext, AmplifyError, spinner } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { sync as execaSync } from 'execa';

export default async function runBuildCommand(context: $TSContext) {
  if (
    context.exeInfo.inputParams.runBuildCommand &&
    context.exeInfo.projectConfig.frontend === 'javascript' &&
    context.exeInfo.projectConfig?.javascript?.config?.BuildCommand
  ) {
    const { BuildCommand } = context.exeInfo.projectConfig.javascript.config;
    const buildCommandArray = BuildCommand.split(' ');
    const buildCommandBase = buildCommandArray[0];
    const buildCommandArgs = buildCommandArray.slice(1);
    try {
      printer.info(`Executing build command: ${BuildCommand}`);
      spinner.start('Building app...');
      await execaSync(buildCommandBase, buildCommandArgs, {
        stdio: 'inherit',
      });
      spinner.succeed('Successfully built app with build command.');
    } catch (e) {
      throw new AmplifyError('ConfigurationError', {
        message: 'Build command failed.',
        resolution: 'See the output above for resolution.',
      });
    }
  }
}
