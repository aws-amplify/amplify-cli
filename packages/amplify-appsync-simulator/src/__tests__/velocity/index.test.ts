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
    it('should handle string comparison', () => {
      const template = new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content: `
#if( $ctx.stash.get("current_user_id")!=$ctx.prev.result.current_user_id)
"not the same value"
#else
"the same value"
#end`,
        },
        simulator,
      );
      const info = mockInfo;
      const result = template.render(
        {
          arguments: {},
          source: {},
          stash: {
            current_user_id: 'someString',
          },
          prevResult: {
            current_user_id: 'someString',
          },
        },
        {
          headers: { Key: 'value' },
          requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        info,
      );
      expect(result.errors).toEqual([]);
      expect(result.result).toEqual('the same value');
    });
  });
});
