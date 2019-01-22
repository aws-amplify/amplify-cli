const { addWalkthrough } = require('../../provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough');

describe('test Pinpoint walkthrough: ', () => {
  const mockGetProjectDetails = jest.fn();
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const serviceMetadata = {
    inputs: [
      {
        key: 'resourceName',
        question: 'Provide a friendly resource name:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      },
      {
        key: 'appName',
        question: 'Provide your pinpoint resource name:',
        validation: {
          operator: 'regex',
          value: '^[a-zA-Z0-9]+$',
          onErrorMsg: 'Resource name should be alphanumeric',
        },
        required: true,
      },
    ],
    defaultValuesFilename: 'pinpoint-defaults.js',
    serviceWalkthroughFilename: 'pinpoint-walkthrough.js',
    cfnFilename: 'pinpoint-cloudformation-template.yml.ejs',
    provider: 'awscloudformation',
  };
  const realProcess = process;
  const exitMock = jest.fn();

  const defaultValuesFilename = 'pinpoint-defaults.js';

  const mockContext = {
    amplify: {
      getProjectDetails: mockGetProjectDetails,
    },
    print: {
      warning: jest.fn().mockImplementation(info => console.log(info)),
      info: jest.fn().mockImplementation(info => console.log(info)),
      error: jest.fn().mockImplementation(info => console.log(info)),
    },
  };

  it('fail when adding analytics when analytics have already been added', async () => {
    global.process = { ...realProcess, exit: exitMock };
    mockGetProjectDetails.mockReturnValue({
      projectConfig: {
        projectPath: mockProjectPath,
      },
      amplifyMeta: {
        analytics: {
          foo: {
            service: 'Pinpoint',
          },
        },
      },
    });
    await addWalkthrough(mockContext, defaultValuesFilename, serviceMetadata);
    expect(mockContext.print.warning).toBeCalledWith('Pinpoint analytics have already been added to your project.');
    global.process = realProcess;
  });

  /* it('successfully add analytics', async () => {
    mockGetProjectDetails.mockReturnValue({
      projectConfig: {
        projectPath: mockProjectPath,
      },
      amplifyMeta: {}
    });

    await addWalkthrough(mockContext, defaultValuesFilename, serviceMetadata);

  }); */
});
