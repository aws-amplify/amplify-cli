import { CLIParams, ViewResourceTableParams } from '../cliViewAPI';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

describe('CLI View tests', () => {
    test('Verbose mode CLI status with category list should correctly initialize ViewResourceTableParams [Non-Help]', () => {
        const cliParams : CLIParams  = {
                                            cliCommand: 'status',
                                            cliSubcommands: undefined,
                                            cliOptions: { 
                                                            storage: true, 
                                                            api: true, 
                                                            verbose: true, 
                                                            yes: false 
                                                        }
                                        }
        const view = new ViewResourceTableParams(cliParams);
        expect( view.command ).toBe("status");
        expect( view.categoryList).toStrictEqual(['storage', 'api']);
        expect( view.help ).toBe(false);
        expect( view.verbose ).toBe(true);
      }); 

    test('Status Help CLI should correctly return styled help message', () => {
        const cliParams : CLIParams  = {
                                            cliCommand: 'status',
                                            cliSubcommands: [ 'help' ],
                                            cliOptions: { yes: false }
                                       };

        const view = new ViewResourceTableParams(cliParams);
        expect( view.command ).toBe("status");
        expect( view.categoryList).toStrictEqual([]);
        expect( view.help ).toBe(true);
        expect( view.verbose ).toBe(false);
        const styledHelp = stripAnsi(chalk.reset(view.getStyledHelp()));
        expect(styledHelp).toMatchSnapshot();
    });

    test('Status Command should print error message to the screen', () => {
        const cliParams : CLIParams  = {
                                            cliCommand: 'status',
                                            cliSubcommands: [ 'help' ],
                                            cliOptions: { yes: false }
                                       };
        const view = new ViewResourceTableParams(cliParams);
        const errorMockFn = jest.fn();

        const context: any = {
            print : {
                error: errorMockFn
            }
        };
        const errorMessage = "Something bad happened"
        try {
            throw new Error(errorMessage);
          }
        catch(e) {
            view.logErrorException(e, context);
            expect(errorMockFn).toBeCalledTimes(1);
        }

    });
    
} );