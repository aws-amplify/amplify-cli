const inquirer = require('inquirer');
const mockirer = require('mockirer'); 

const mockTemplate = require('../../../../__mocks__/mockTemplate');

const configureWebsite = require('../../../../lib/S3AndCloudFront/helpers/configure-Website'); 

describe('configure-Website', ()=>{
    const mockContext = {
        exeInfo: {
            template: mockTemplate
        }
    }; 

    const indexDoc = 'index.html'; 
    const errorDoc = 'error.html'; 
    beforeAll(()=>{
        mockirer(inquirer, {
            IndexDocument: indexDoc,
            ErrorDocument: errorDoc
        })
    }); 

    test('configure', async ()=>{
        const { WebsiteConfiguration } = mockContext.exeInfo.template.Resources.S3Bucket.Properties;
        const result = await configureWebsite.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(WebsiteConfiguration.IndexDocument).toEqual(indexDoc.trim()); 
        expect(WebsiteConfiguration.ErrorDocument).toEqual(errorDoc.trim()); 
    }); 
});