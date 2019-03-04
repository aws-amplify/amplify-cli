const fs = require('fs-extra');
const path = require('path');
const publishConfig = require('../../../../lib/S3AndCloudFront/helpers/configure-Publish');

const fileScanner = require('../../../../lib/S3AndCloudFront/helpers/file-scanner'); 

describe('file-scanner', () => {
    const mockDistDirPath = 'dist'; 
    const mockIndexDocName = 'index.html'; 
    const mockIndexDocPath = path.join(mockDistDirPath, mockIndexDocName);
    const otherFileName = 'otherfile';

    const mockContext = {
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    beforeAll(() => {
        publishConfig.isIgnored =  jest.fn(()=>{return false;}); 
        publishConfig.getIgnore = jest.fn(()=>{return [];}); 
        fs.existsSync = jest.fn(); 
        fs.readdirSync = jest.fn(); 
        fs.statSync = jest.fn(); 
    }); 

    beforeEach(() => {
        fs.existsSync.mockClear(); 
        fs.readdirSync.mockClear(); 
        fs.statSync.mockClear(); 
    });

    test('scan, happy route', async () => {
        fs.existsSync = jest.fn((itemPath)=>{ 
            let result = false; 
            if(itemPath === mockDistDirPath){
                result = true; 
            }else if(itemPath === mockIndexDocPath){
                result = true; 
            }
            return result; 
        });
        fs.readdirSync = jest.fn(()=>{ return [mockIndexDocName]}); 
        fs.statSync = jest.fn(()=>{ 
            return {
                isDirectory: ()=>{return false;}
            }
        }); 

        let result; 
        let err; 

        try{
            result = fileScanner.scan(mockContext, mockDistDirPath, mockIndexDocName); 
        }catch(e){
            err = e; 
        }

        expect(result).toBeDefined(); 
        expect(Array.isArray(result)).toBeTruthy();
        expect(err).not.toBeDefined(); 
    });

    test('scan, dist dir empty', async () => {
        fs.existsSync = jest.fn((itemPath)=>{ 
            let result = false; 
            if(itemPath === mockDistDirPath){
                result = true; 
            }else if(itemPath === mockIndexDocPath){
                result = false; 
            }
            return result; 
        });
        fs.readdirSync = jest.fn(()=>{ return []}); 
        fs.statSync = jest.fn(()=>{ 
            return {
                isDirectory: ()=>{return false;}
            }
        }); 

        let result; 
        let err; 

        try{
            result = fileScanner.scan(mockContext, mockDistDirPath, mockIndexDocName); 
        }catch(e){
            err = e; 
        }

        expect(result).not.toBeDefined(); 
        expect(err).toBeDefined(); 
    });

    test('scan, dist dir does not exist', async () => {
        fs.existsSync = jest.fn((itemPath)=>{ 
            let result = false; 
            if(itemPath === mockDistDirPath){
                result = false; 
            }else if(itemPath === mockIndexDocPath){
                result = false; 
            }
            return result; 
        });
        fs.readdirSync = jest.fn(()=>{ return []}); 
        fs.statSync = jest.fn(()=>{ 
            return {
                isDirectory: ()=>{return false;}
            }
        }); 

        let result; 
        let err; 

        try{
            result = fileScanner.scan(mockContext, mockDistDirPath, mockIndexDocName); 
        }catch(e){
            err = e; 
        }

        expect(result).not.toBeDefined(); 
        expect(err).toBeDefined(); 
    });

    test('scan, index doc does not exist', async () => {
        fs.existsSync = jest.fn((itemPath)=>{ 
            let result = false; 
            if(itemPath === mockDistDirPath){
                result = false; 
            }else if(itemPath === mockIndexDocPath){
                result = false; 
            }
            return result; 
        });
        fs.readdirSync = jest.fn(()=>{ return [otherFileName]}); 
        fs.statSync = jest.fn(()=>{ 
            return {
                isDirectory: ()=>{return false;}
            }
        }); 

        let result; 
        let err; 

        try{
            result = fileScanner.scan(mockContext, mockDistDirPath, mockIndexDocName); 
        }catch(e){
            err = e; 
        }

        expect(result).not.toBeDefined(); 
        expect(err).toBeDefined(); 
    });
})