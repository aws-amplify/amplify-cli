import { truncateResourceNames } from '../../../../provider-utils/awscloudformation/utils/truncateResourceNames';

const longName = 'thisIsASuperLongNameWowLookAtThisItJustKeepsOnGoingHolySmokesWhyAreYouStillReadingThis';
const shortName = 'thisIsAReasonableName';

describe('truncateResourceNames', () => {
  it('returns empty object if no resource names in input', () => {
    expect(truncateResourceNames({})).toEqual({});
  });

  it('does not mutate input', () => {
    const input = { functionName: longName };
    truncateResourceNames(input);
    expect(input).toStrictEqual({ functionName: longName });
  });

  it('returns given resource names if below limits', () => {
    expect(truncateResourceNames({ functionName: shortName, roleName: shortName })).toStrictEqual({
      functionName: shortName,
      roleName: shortName,
    });
  });

  it('truncates resources names at 54 characters', () => {
    const result = truncateResourceNames({ functionName: longName, roleName: longName });
    expect(result.functionName?.length).toBe(54);
    expect(result.roleName?.length).toBe(54);
  });

  it('truncates resource names above limit', () => {
    expect(truncateResourceNames({ functionName: longName, roleName: longName })).toMatchInlineSnapshot(`
{
  "functionName": "thisIsASuperLongNameWreYouStillReadingThis2670c1f20258",
  "roleName": "thisIsASuperLongNameWreYouStillReadingThis2670c1f20258",
}
`);
  });

  it('shortens names deterministically', () => {
    const result1 = truncateResourceNames({ roleName: longName });
    const result2 = truncateResourceNames({ roleName: longName });
    expect(result1).toStrictEqual(result2);
  });
});
