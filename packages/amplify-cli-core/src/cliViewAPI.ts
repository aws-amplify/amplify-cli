//Use this file to store all types used between the CLI commands and the view/display functions
// CLI=>(command-handler)==[CLI-View-API]=>(ux-handler/report-handler)=>output-stream

export interface CLIParams {
    cliCommand : string;
    cliOptions : {[key:string] : any};
}
//Resource Table filter and display params (params used for summary/display view of resource table)
export class ViewResourceTableParams {
    public command : string;
    public verbose : boolean; //display table in verbose mode
    public categoryList : string[]|[] //categories to  display
    public filteredResourceList : any //resources to *not* display - TBD define union of valid types
    getCategoryFromCLIOptions( cliOptions : object ){
        if ( cliOptions ){
            return Object.keys(cliOptions).filter( key => (key != 'verbose') && (key !== 'yes') )
        } else {
            return [];
        }
    }

    public constructor( cliParams : CLIParams ){
        this.command = cliParams.cliCommand;
        this.verbose = (cliParams.cliOptions?.verbose === true );
        this.categoryList = this.getCategoryFromCLIOptions( cliParams.cliOptions );
        this.filteredResourceList = []; //TBD - add support to provide resources
    }
}