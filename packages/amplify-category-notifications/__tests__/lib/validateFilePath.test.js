const fs = require('fs-extra'); 
const validateFilePath = require('../../lib/validateFilepath'); 

describe('validateFilePath', () => {
    const mockFielPath = 'mockFilePath'
    beforeAll(() => {
        fs.existsSync = jest.fn((_)=>{
            return true; 
        })
    }); 

    beforeEach(() => { 
    });

    test('validateFilePath', () => {
        const result = validateFilePath(mockFielPath); 
        expect(fs.existsSync).toBeCalledWith(mockFielPath); 
        expect(result).toBe(true); 
    });
})