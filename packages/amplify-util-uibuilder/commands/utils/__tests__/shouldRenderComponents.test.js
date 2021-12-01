const { shouldRenderComponents } = require('../shouldRenderComponents');

describe('should render components', () => {
  let context;
  beforeEach(() => {
    context = {
      input: {
        options: {
          'no-codegen': false,
        },
      },
      exeInfo: {
        projectConfig: {
          providers: ['awscloudformation'],
          frontend: 'javascript',
          javascript: {
            framework: 'react',
          },
        },
      },
    };
  });
  it('works with a valid config', async () => {
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(true);
  });
  it("doesn't work if --no-codegen flag is set", async () => {
    context.input.options['no-codegen'] = true;
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });
  it("doesn't work if provider is not awscloudformation", async () => {
    context.exeInfo.projectConfig.providers = [];
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });
  it("doesn't work if the frontend is not javascript", async () => {
    context.exeInfo.projectConfig.frontend = 'ios';
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });
  it("doesn't work if the frontend is not javascript", async () => {
    context.exeInfo.projectConfig.javascript.framework = 'vue';
    const shouldIt = await shouldRenderComponents(context);
    expect(shouldIt).toBe(false);
  });
});
