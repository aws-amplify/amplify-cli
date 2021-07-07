//Use this file to store all types used between the CLI commands and the view/display functions
// CLI=>(command-handler)==[CLI-View-API]=>(ux-handler/report-handler)=>output-stream
import chalk from 'chalk';
export interface CLIParams {
    cliCommand : string;
    cliSubcommands: string[]|undefined;
    cliOptions : {[key:string] : any};
}
//Resource Table filter and display params (params used for summary/display view of resource table)
export class ViewResourceTableParams {
    public command : string;
    public verbose : boolean; //display table in verbose mode
    public help : boolean; //display help for the command
    public categoryList : string[]|[] //categories to  display
    public filteredResourceList : any //resources to *not* display - TBD define union of valid types
    getCategoryFromCLIOptions( cliOptions : object ){
        if ( cliOptions ){
            return Object.keys(cliOptions).filter( key => (key != 'verbose') && (key !== 'yes') )
        } else {
            return [];
        }
    }
    styleHeader(str : string) {
        return chalk.italic(chalk.bgGray.whiteBright(str));
    }
    styleCommand( str : string) {
        return chalk.greenBright(str);
    }
    styleOption( str : string) {
        return chalk.yellowBright(str);
    }
    stylePrompt( str : string ){
        return chalk.bold(chalk.yellowBright(str));
    }
    styleNOOP( str : string){
        return chalk.italic(chalk.grey(str));
    }
    public getStyledHelp(){
      return `
${this.styleHeader("NAME")}
${this.styleCommand("amplify status")} --  Shows the state of local resources not yet pushed to the cloud (Create/Update/Delete)

${this.styleHeader("SYNOPSIS")}
${this.styleCommand("amplify status")} [${this.styleCommand("-v")} [${this.styleOption("category ...")}] ] 

${this.styleHeader("DESCRIPTION")}
The amplify status command displays the difference between the deployed state and the local state of the application.
The following options are available: 

${this.styleNOOP("no options")}        : (Summary mode) Displays the summary of local state vs deployed state of the application
${this.styleCommand("-v [category ...]")} : (Verbose mode) Displays the cloudformation diff for all resources for the specificed category. 
                    If no category is provided, it shows the diff for all categories.
                    usage:
                    ${this.stylePrompt("#\>")} ${this.styleCommand("amplify status -v")}
                    ${this.stylePrompt("#\>")} ${this.styleCommand("status -v ")}${this.styleOption( "api storage")}
                               
        `
    }

    public constructor( cliParams : CLIParams ){
        this.command = cliParams.cliCommand;
        this.verbose = (cliParams.cliOptions?.verbose === true );
        this.categoryList = this.getCategoryFromCLIOptions( cliParams.cliOptions );
        this.filteredResourceList = []; //TBD - add support to provide resources
        this.help = (cliParams.cliSubcommands)?cliParams.cliSubcommands.includes("help"):false;
    }
}