import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { CLIInput } from './domain/command-input';
import { getAmplifyLogger, Redactor } from '@aws-amplify/amplify-cli-logger';

export function logInput(input: CLIInput): void {
  getAmplifyLogger().logInfo({
    message: `amplify ${input.command ? input.command : ''} \
${input.plugin ? input.plugin : ''} \
${input.subCommands ? input.subCommands.join(' ') : ''} \
${input.options ? Redactor(JSONUtilities.stringify(input.options, { minify: true })) : ''}`,
  });
}
