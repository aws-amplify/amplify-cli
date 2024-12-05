import { CommandModule } from 'yargs';
import { Gen2Command } from './gen2_command';
import { Gen2StartCommand } from './start/start_command';
import { Gen2ExecuteCommand } from './execute/execute_command';

export const createGen2Command = (): CommandModule => {
  const gen2StartCommand = new Gen2StartCommand();
  const gen2ExecuteCommand = new Gen2ExecuteCommand();
  return new Gen2Command([gen2StartCommand, gen2ExecuteCommand as unknown as CommandModule]);
};
