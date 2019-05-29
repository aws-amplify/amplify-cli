const validateDocName = require('../../../../lib/S3AndCloudFront/helpers/validate-website-doc-name'); 

describe('validate-website-doc-name', ()=>{
    test('validate, not empty', ()=>{
        const docName = '   '; 
        const result = validateDocName(docName); 
        expect(typeof(result) === 'boolean').toBeFalsy(); 
    }); 

    test('validate, no slash', ()=>{
        const docName = 'doc/name/w/slash'; 
        const result = validateDocName(docName); 
        expect(typeof(result) === 'boolean').toBeFalsy(); 
    }); 

    test('validate, good doc name', ()=>{
        const docName = 'good.html'; 
        const result = validateDocName(docName); 
        expect(typeof(result) === 'boolean').toBeTruthy(); 
        expect(result).toEqual(true); 
    }); 
}); 