const { prompter } = require('@aws-amplify/amplify-prompts');
const mockTemplate = require('../../../../__mocks__/mockTemplate-noCloudFront');
const configureWebsite = require('../../../../lib/S3AndCloudFront/helpers/configure-Website');

jest.mock('@aws-amplify/amplify-prompts');

describe('configure-Website', () => {
  const mockContext = {
    exeInfo: {
      template: mockTemplate,
    },
    print: {
      warning: jest.fn(),
    },
  };

  const indexDoc = 'index.html';
  const errorDoc = 'error.html';
  beforeAll(() => {
    prompter.input = jest.fn().mockReturnValueOnce(indexDoc).mockReturnValueOnce(errorDoc);
  });

  test('configure', async () => {
    const { WebsiteConfiguration } = mockContext.exeInfo.template.Resources.S3Bucket.Properties;
    const result = await configureWebsite.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(WebsiteConfiguration.IndexDocument).toEqual(indexDoc.trim());
    expect(WebsiteConfiguration.ErrorDocument).toEqual(errorDoc.trim());
  });
});
