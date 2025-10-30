import { CommandModule } from 'yargs';
import { Gen2Command } from './gen2_command';
import { AmplifyMigrationGenerateStep } from '../generate';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

export const createGen2Command = (): CommandModule => {
  const gen2GenerateCommand = new AmplifyMigrationGenerateStep({} as $TSContext);

  return new Gen2Command([gen2GenerateCommand]);
};
