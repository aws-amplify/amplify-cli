/** CLI Input */
/**
 * Input parameters provided as part of the amplify command walk-through
 */
export interface ICommandInput {
  argv: Array<string>;
  plugin?: string;
  command: string;
  subCommands?: string[];
  options?: {
    [key: string]: string | boolean;
  };
}
