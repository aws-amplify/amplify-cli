import { extractTableName } from '../../../../../../commands/gen2-migration/generate/amplify/function/function.renderer';

describe('extractTableName', () => {
  it('recovers original casing via case-insensitive match against known model names', () => {
    const models = ['randomItem', 'Meal'];
    expect(extractTableName('API_MYAPI_RANDOMITEMTABLE_ARN', models)).toBe('randomItem');
    expect(extractTableName('API_MYAPI_MEALTABLE_NAME', models)).toBe('Meal');
  });

  it('matches model names that contain underscores (greedy prefix must not swallow them)', () => {
    // A positional `/API_.*_(.+?)TABLE_/` regex captures `MODEL` here because the
    // greedy `.*` eats `MY_`. Matching the known name directly avoids that.
    expect(extractTableName('API_MYAPI_MY_MODELTABLE_ARN', ['my_model'])).toBe('my_model');
  });

  it('does not confuse a model whose uppercased name is a suffix of another', () => {
    const models = ['Item', 'LineItem'];
    expect(extractTableName('API_MYAPI_LINEITEMTABLE_ARN', models)).toBe('LineItem');
    expect(extractTableName('API_MYAPI_ITEMTABLE_ARN', models)).toBe('Item');
  });

  it('falls back to naive capitalization when no model names are supplied', () => {
    expect(extractTableName('API_MYAPI_SOMETABLE_NAME')).toBe('Some');
  });

  it('anchors the fallback to the last segment before TABLE_ (ARN|NAME)', () => {
    // Without known model names the greedy-prefix bug would capture `MODEL`;
    // anchoring keeps the fallback deterministic on the final segment.
    expect(extractTableName('API_MYAPI_MY_MODELTABLE_ARN')).toBe('Model');
  });

  it('returns undefined for env vars that are not table references', () => {
    expect(extractTableName('API_MYAPI_GRAPHQLAPIIDOUTPUT')).toBeUndefined();
  });
});
