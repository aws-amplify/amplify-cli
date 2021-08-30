import { generateSandboxMode } from '../../resolvers';
import { getInputType } from '../test-utils/helpers';

describe('generateSandboxMode', () => {
  let ctx: any;

  beforeEach(() => {
    ctx = {
      resourceHelper: {
        api: { globalSandboxModeEnabled: undefined },
      },
    };
  });

  describe('when sandbox mode disabled', () => {
    beforeEach(() => {
      ctx.resourceHelper.api.globalSandboxModeEnabled = false;
    });

    it('generates unauthorized expression', () => {
      const exp: any = generateSandboxMode(ctx);
      const { value } = exp.expressions.find((e: any) => e.kind === 'Reference');

      expect(value).toEqual('util.unauthorized');
    });
  });

  describe('when sandbox mode enabled', () => {
    beforeEach(() => {
      ctx.resourceHelper.api.globalSandboxModeEnabled = true;
    });

    it('generates unauthorized expression for non API_KEY authorization type', () => {
      const exp: any = generateSandboxMode(ctx);
      const { kind, leftExpr, rightExpr } = exp.predicate;
      const leftExprValue = leftExpr.expressions.find((e: any) => e.kind === 'Reference').value;

      expect(kind).toEqual('NotEquals');
      expect(leftExprValue).toEqual('util.authType');
      expect(rightExpr.value).toEqual('API_KEY');

      const { value } = exp.expr.expressions.find((e: any) => e.kind === 'Reference');

      expect(value).toEqual('util.unauthorized');
    });
  });
});
