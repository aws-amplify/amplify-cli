import { Argv, CommandModule } from 'yargs';

export type Gen2CommandOptions = Record<string, never>;

/**
 * Command that starts Gen2 migration.
 */
export class Gen2Command implements CommandModule {
  /**
   * @inheritDoc
   */
  readonly command: string;

  /**
   * @inheritDoc
   */
  readonly describe: string;

  constructor(private readonly subCommands: CommandModule[]) {
    this.command = 'migration';
    this.describe = 'Migrates an Amplify Gen1 app to a Gen2 app';
  }

  builder = (yargs: Argv): Argv => {
    return yargs.version(false).command(this.subCommands).strictCommands().recommendCommands();
  };
  handler = (): Promise<void> => {
    // CommandModule requires handler implementation. But this is never called if top level command
    // is configured to require subcommand.
    // Help is printed by default in that case before ever attempting to call handler.
    throw new Error(`Top level gen2 handler should never be called`);
  };
}
