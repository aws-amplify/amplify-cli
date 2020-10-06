import { GraphQLResolveInfo } from 'graphql';
import { AmplifyAppSyncSimulator } from '../..';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { VelocityTemplate } from '../../velocity';
import { mockInfo } from './util/general-utils.test';

describe('VelocityTemplate', () => {
  let content;
  let simulator;
  beforeAll(() => {
    content = `"$ctx.error.message, $ctx.error.type"`;
    simulator = new AmplifyAppSyncSimulator();
  });

  describe('#render', () => {
    it('should handle unknow errors', () => {
      const template = new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content,
        },
        simulator,
      );
      const info = mockInfo;
      const result = template.render(
        {
          error: new Error('some unexpected error'),
          arguments: {},
          source: {},
        },
        {
          headers: { Key: 'value' },
          requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        info,
      );
      expect(result.errors).toEqual([]);
      expect(result.result).toEqual('some unexpected error, UnknowErrorType');
    });
  });

  describe('#render', () => {
    it('should handle with a not error in error', () => {
      const template = new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content,
        },
        simulator,
      );
      const info = mockInfo;
      const result = template.render(
        {
          error: 'my string as error',
          arguments: {},
          source: {},
        },
        {
          headers: { Key: 'value' },
          requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        info,
      );
      expect(result.errors).toEqual([]);
      expect(result.result).toEqual('Error: my string as error, UnknowErrorType');
    });
  });
});
