import { Input } from './domain/input';

const rewiredCommands: { [key: string]: { warningMsg: string; plugin: string; command: string } } = {
  'function.invoke': {
    warningMsg:
      '"amplify function invoke <function name>" is deprecated and will be removed in a future version.\nUse "amplify mock function <function name>" instead.',
    plugin: 'mock',
    command: 'function',
  },
};

// updates input if there is a matching entry in rewiredCommands
export function rewireDeprecatedCommands(input: Input): void {
  const newCommand = rewiredCommands[input.plugin + '.' + input.command];
  if (newCommand) {
    input.plugin = newCommand.plugin;
    input.command = newCommand.command;
    console.warn(newCommand.warningMsg);
  }
}
