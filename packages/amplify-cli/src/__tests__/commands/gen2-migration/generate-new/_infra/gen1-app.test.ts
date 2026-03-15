import { Gen1App } from '../../../../../commands/gen2-migration/generate-new/_infra/gen1-app';

/**
 * Creates a Gen1App with a known _meta for testing discover().
 */
function createGen1AppWithMeta(meta: Record<string, unknown>): Gen1App {
  const app = Object.create(Gen1App.prototype);
  app._meta = meta;
  return app;
}

describe('Gen1App.discover()', () => {
  it('returns resources from all categories', () => {
    const app = createGen1AppWithMeta({
      auth: { myPool: { service: 'Cognito' } },
      storage: { myBucket: { service: 'S3' } },
      function: { myFunc: { service: 'Lambda' } },
    });

    const resources = app.discover();

    expect(resources).toEqual([
      { category: 'auth', resourceName: 'myPool', service: 'Cognito' },
      { category: 'storage', resourceName: 'myBucket', service: 'S3' },
      { category: 'function', resourceName: 'myFunc', service: 'Lambda' },
    ]);
  });

  it('skips the providers category', () => {
    const app = createGen1AppWithMeta({
      providers: { awscloudformation: { service: 'CloudFormation' } },
      auth: { myPool: { service: 'Cognito' } },
    });

    const resources = app.discover();

    expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito' }]);
  });

  it('skips the hosting category', () => {
    const app = createGen1AppWithMeta({
      hosting: { amplifyhosting: { service: 'amplifyhosting' } },
      auth: { myPool: { service: 'Cognito' } },
    });

    const resources = app.discover();

    expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito' }]);
  });

  it('skips resources without a service field', () => {
    const app = createGen1AppWithMeta({
      auth: {
        myPool: { service: 'Cognito' },
        noService: { providerPlugin: 'awscloudformation' },
      },
    });

    const resources = app.discover();

    expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito' }]);
  });

  it('skips non-object category values', () => {
    const app = createGen1AppWithMeta({
      auth: { myPool: { service: 'Cognito' } },
      someString: 'not an object',
    });

    const resources = app.discover();

    expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito' }]);
  });

  it('returns empty array for empty meta', () => {
    const app = createGen1AppWithMeta({});

    expect(app.discover()).toEqual([]);
  });

  it('handles multiple resources in the same category', () => {
    const app = createGen1AppWithMeta({
      storage: {
        myBucket: { service: 'S3' },
        myTable: { service: 'DynamoDB' },
      },
    });

    const resources = app.discover();

    expect(resources).toEqual([
      { category: 'storage', resourceName: 'myBucket', service: 'S3' },
      { category: 'storage', resourceName: 'myTable', service: 'DynamoDB' },
    ]);
  });
});
