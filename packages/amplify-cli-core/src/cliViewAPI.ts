//Use this file to store all types used between the CLI commands and the view/display functions
// CLI=>(command-handler)==[CLI-View-API]=>(ux-handler/report-handler)=>output-stream
import chalk from 'chalk';
import { $TSAny, $TSContext } from '.';
export interface CLIParams {
  cliCommand: string;
  cliSubcommands: string[] | undefined;
  cliOptions: Record<string, $TSAny>;
}
//Resource Table filter and display params (params used for summary/display view of resource table)
export class ViewResourceTableParams {
  private _command: string;
  private _verbose: boolean; //display table in verbose mode
  private _help: boolean; //display help for the command
  private _categoryList: string[] | []; //categories to  display
  private _filteredResourceList: $TSAny; //resources to *not* display - TBD define union of valid types

  public get command() {
    return this._command;
  }

  public get verbose() {
    return this._verbose;
  }

  public get help() {
    return this._help;
  }

  public get categoryList() {
    return this._categoryList;
  }

  getCategoryFromCLIOptions(cliOptions: object) {
    if (cliOptions) {
      return Object.keys(cliOptions)
        .filter(key => key !== 'verbose' && key !== 'yes' && key !== 'debug')
        .map(category => category.toLowerCase());
    } else {
      return [];
    }
  }

  styleHeader(str: string) {
    return chalk.italic(chalk.bgGray.whiteBright(str));
  }

  styleCommand(str: string) {
    return chalk.greenBright(str);
  }

  styleOption(str: string) {
    return chalk.yellowBright(str);
  }

  stylePrompt(str: string) {
    return chalk.bold(chalk.yellowBright(str));
  }

  public getStyledHelp() {
    return `
${this.styleHeader('NAME')}
${this.styleCommand('amplify status')} --  Shows the state of local resources not yet pushed to the cloud (Create/Update/Delete)

${this.styleHeader('SYNOPSIS')}
${this.styleCommand('amplify status')} [${this.styleCommand('-v')}|${this.styleCommand('--verbose')}] [${this.styleOption('category ...')}]

${this.styleHeader('DESCRIPTION')}
The amplify status command displays the difference between the deployed state and the local state of the application.
The following options are available:

${this.styleCommand('[category ...]')}    : (Summary mode) Displays the summary of local state vs deployed state of the application
                    usage:
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status')}
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status')} ${this.styleOption('api storage')}

${this.styleCommand('-v [category ...]')} : (Verbose mode) Displays the cloudformation diff for all resources for the specified category.
                    If no category is provided, it shows the diff for all categories.
                    usage:
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status -v')}
                    ${this.stylePrompt('#>')} ${this.styleCommand('amplify status -v ')}${this.styleOption('api storage')}

    `;
  }

  public logErrorException(e: Error, context: $TSContext) {
    context.print.error(`Name: ${e.name} : Message: ${e.message}`);
  }

  public constructor(cliParams: CLIParams) {
    this._command = cliParams.cliCommand;
    this._verbose = cliParams.cliOptions?.verbose === true;
    this._categoryList = this.getCategoryFromCLIOptions(cliParams.cliOptions);
    this._filteredResourceList = []; //TBD - add support to provide resources
    this._help = cliParams.cliSubcommands ? cliParams.cliSubcommands.includes('help') : false;
  }
}
