import { UnknownArgumentError } from 'amplify-cli-core';


describe('amplify status: ', () => {
    const mockExit = jest.fn();
    jest.mock('amplify-cli-core', () => ({
      exitOnNextTick: mockExit,
      UnknownArgumentError: UnknownArgumentError,
    }));
    const { run } = require('../../commands/status');
    const runStatusCmd = run;

    it('status run method should exist', () => {
        expect(runStatusCmd).toBeDefined();
    });

    it('status run method should call context.amplify.showStatusTable', async () => {
        const mockContextNoCLArgs = {
          amplify: {
            showStatusTable: jest.fn(),
          },
          parameters: {
            array: [],
          },
        };
        runStatusCmd(mockContextNoCLArgs)
        expect(mockContextNoCLArgs.amplify.showStatusTable).toBeCalled();
      });

    it('status -v run method should call context.amplify.showStatusTable', async () => {
        const mockContextWithVerboseOptionAndCLArgs = {
            amplify: {
              showStatusTable: jest.fn(),
            },
            input :{
                command: "status",
                options: {
                    verbose : true
                }
            }
        };
        runStatusCmd(mockContextWithVerboseOptionAndCLArgs)
        expect(mockContextWithVerboseOptionAndCLArgs.amplify.showStatusTable).toBeCalled();
    });

    it('status -v <category> run method should call context.amplify.showStatusTable', async () => {
        const mockContextWithVerboseOptionAndCLArgs = {
            amplify: {
              showStatusTable: jest.fn(),
            },
            input :{
                command: "status",
                options: {
                    verbose : true,
                    api : true,
                    storage : true
                }
            }
        };
        runStatusCmd(mockContextWithVerboseOptionAndCLArgs)
        expect(mockContextWithVerboseOptionAndCLArgs.amplify.showStatusTable).toBeCalled();
    });


})