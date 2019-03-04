const fs = require('fs-extra'); 
const inquirer = require('inquirer');

const configurePublish = require('../../../../lib/S3AndCloudFront/helpers/configure-Publish'); 

describe('configure-Publish', ()=>{
    const DONE = 'exit';
    const configActions = {
        list: 'list', 
        add: 'add', 
        remove: 'remove', 
        removeAll: 'remove all', 
        done: DONE
    };
    const mockContext = {
        amplify: {
            pathManager: {
                searchProjectRootPath: jest.fn(()=>{
                    return 'mockProjectRootDirPath'; 
                })
            }
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    beforeAll(()=>{
        inquirer.prompt = jest.fn(); 
        fs.existsSync = jest.fn(()=>{return true;})
        fs.writeFileSync = jest.fn();
    }); 

    beforeEach(()=>{
        inquirer.prompt.mockClear(); 
        fs.existsSync.mockClear(); 
        fs.writeFileSync.mockClear(); 
    }); 

    test('configure, flow1', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({action: configActions.list}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce({patternToAdd: 'mockPattern1'}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce({patternToAdd: 'mockPattern2'}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.remove}); 
        inquirer.prompt.mockResolvedValueOnce({patternToRemove: 'mockPattern1'}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        const result = await configurePublish.configure(mockContext); 
        expect(mockContext.print.info).toBeCalled(); 
        expect(fs.writeFileSync).toBeCalled(); 
        expect(Array.isArray(result)).toBeTruthy(); 
        expect(result.includes('mockPattern1')).toBeFalsy(); 
        expect(result.includes('mockPattern2')).toBeTruthy(); 
    }); 

    test('configure, flow2', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce({patternToAdd: 'mockPattern1'}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce({patternToAdd: 'mockPattern2'}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.removeAll}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        const result = await configurePublish.configure(mockContext); 
        expect(mockContext.print.info).toBeCalled(); 
        expect(fs.writeFileSync).toBeCalled(); 
        expect(Array.isArray(result)).toBeTruthy(); 
        expect(result.length).toEqual(0);
    }); 

    test('getIgnore', async ()=>{
        const result = await configurePublish.getIgnore(mockContext); 
        expect(Array.isArray(result)).toBeTruthy(); 
        expect(result.length).toEqual(0);
    }); 

    test('isIgnored', async ()=>{
        const result = configurePublish.isIgnored('dist/ignoredFile', ['ignoredFile'], 'dist'); 
        expect(typeof(result)).toEqual('boolean');
        expect(result).toEqual(true);
    }); 
});