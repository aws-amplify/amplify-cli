import { CommandModule } from 'yargs';
import { Gen2Command } from './gen2_command';
import { Gen2StartCommand } from './start/start_command';
import { GenerateTemplatesCommand } from './generate-templates/generate-templates_command';

export const createGen2Command = (): CommandModule => {
  const gen2StartCommand = new Gen2StartCommand();
  const generateTemplatesCommand = new GenerateTemplatesCommand();
  return new Gen2Command([gen2StartCommand, generateTemplatesCommand as unknown as CommandModule]);
};
