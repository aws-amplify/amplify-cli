import { authUpgradePipeline } from '../upgradePipelines';

describe('authUpgradePipeline', () => {
  it('throws error when version is not supported', () => {
    expect(() => authUpgradePipeline(0)).toThrowErrorMatchingInlineSnapshot(
      `"Headless auth upgrade pipeline encountered unknown schema version 0"`,
    );
    expect(() => authUpgradePipeline(3)).toThrowErrorMatchingInlineSnapshot(
      `"Headless auth upgrade pipeline encountered unknown schema version 3"`,
    );
  });

  it('returns upgrade function for version 1', () => {
    expect(authUpgradePipeline(1).length).toBe(1);
  });

  it('returns noop when version is 2', () => {
    expect(authUpgradePipeline(2).length).toBe(0);
  });
});
