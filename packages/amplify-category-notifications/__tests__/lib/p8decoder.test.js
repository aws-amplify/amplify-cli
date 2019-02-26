const fs = require('fs-extra'); 
const p8decoder = require('../../lib/p8decoder'); 

describe('p8decoder', () => {
    const mockKeyString = 'mockKeyString';
    const mockContent = `
    -----KEY-----
    ${mockKeyString}
    `; 
    beforeAll(() => {
        fs.readFileSync = jest.fn(()=>{
            return mockContent; 
        })
    }); 

    beforeEach(() => { 
    });

    test('p8decoder', () => {
        const decodedContent = p8decoder.run('mockFielPath'); 
        expect(decodedContent).toEqual(mockKeyString); 
    });
})