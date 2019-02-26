const constants = require('../../lib/constants'); 

describe('constants', () => {
    beforeAll(() => {
    }); 

    beforeEach(() => { 
    });

    test('constants', () => {
        expect(constants.CategoryName).toBeDefined(); 
        expect(constants.AnalyticsCategoryName).toBeDefined(); 
        expect(constants.PinpointName).toBeDefined(); 
    });
})