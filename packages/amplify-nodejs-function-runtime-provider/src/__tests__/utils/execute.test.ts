import { invokeFunction } from '../../utils/execute';

describe('execute', () => {
  describe('async handler', () => {
    it('should succeed with a returned value', async () => {
      await expect(
        invokeFunction({
          packageFolder: __dirname,
          handler: 'handlers.asyncHandler',
          event: '{"succeed": true}',
          environment: {},
        }),
      ).resolves.toMatchSnapshot();
    });

    it('should fail when throwing an error', async () => {
      await expect(
        invokeFunction({
          packageFolder: __dirname,
          handler: 'handlers.asyncHandler',
          event: '{"succeed": false}',
          environment: {},
        }),
      ).rejects.toMatchSnapshot();
    });
  });

  describe('callback handler', () => {
    it('should succeed with a returned value', async () => {
      await expect(
        invokeFunction({
          packageFolder: __dirname,
          handler: 'handlers.callbackHandler',
          event: '{"succeed": true}',
          environment: {},
        }),
      ).resolves.toMatchSnapshot();
    });

    it('should fail when returning an error', async () => {
      await expect(
        invokeFunction({
          packageFolder: __dirname,
          handler: 'handlers.callbackHandler',
          event: '{"succeed": false}',
          environment: {},
        }),
      ).rejects.toMatchSnapshot();
    });
  });

  describe('non-promise returned handler', () => {
    it('should resolve to null', async () => {
      await expect(
        invokeFunction({
          packageFolder: __dirname,
          handler: 'handlers.nonAsyncHandler',
          event: '{}',
          environment: {},
        }),
      ).resolves.toMatchSnapshot();
    });
  });
});
