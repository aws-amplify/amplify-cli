import { CommandModule } from 'yargs';
import { Gen2Command } from './gen2_command.js';
import { Gen2StartCommand } from './start/start_command.js';

export const createGen2Command = (): CommandModule => {
  const gen2StartCommand = new Gen2StartCommand();
  const gen2Command = new Gen2Command(gen2StartCommand);
  return gen2Command;
};
