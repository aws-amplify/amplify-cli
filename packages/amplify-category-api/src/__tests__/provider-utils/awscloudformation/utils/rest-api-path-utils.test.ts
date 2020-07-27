import {
  validatePathName,
  checkForPathOverlap,
  formatCFNPathParamsForExpressJs,
} from '../../../../provider-utils/awscloudformation/utils/rest-api-path-utils';

const stubOtherPaths = [{ name: '/other/path' }, { name: '/sub/path' }, { name: '/path/{with}/{params}' }];

test('validatePathName_validPath', () => {
  expect(validatePathName('/some/path')).toBe(true);
  expect(validatePathName('/path/{with}/{params}')).toBe(true);
  expect(validatePathName('/')).toBe(true);
});

test('validatePath_empty', () => {
  expect(validatePathName('')).toStrictEqual('The path must not be empty');
});

test('validatePathName_noLeadingSlash', () => {
  expect(validatePathName('no/leading/slash')).toStrictEqual('The path must begin with / e.g. /items');
});

test('validatePathName_hasTrailingSlash', () => {
  expect(validatePathName('/has/trailing/slash/')).toStrictEqual('The path must not end with /');
});

test('validatePathName_invalidCharacters', () => {
  // setup
  const errorMessage =
    'Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.';

  // test
  expect(validatePathName('/invalid+/{char}')).toStrictEqual(errorMessage);
  expect(validatePathName('/invalid/{char@}')).toStrictEqual(errorMessage);
  expect(validatePathName('/invalid/{param')).toStrictEqual(errorMessage);
});

test('checkForPathOverlap_subPathMatch', () => {
  expect(checkForPathOverlap('/sub/path/match', stubOtherPaths)).toEqual({
    higherOrderPath: '/sub/path',
    lowerOrderPath: '/sub/path/match',
  });
});

test('checkForPathOverlap_subPathParamsMatch', () => {
  expect(checkForPathOverlap('/path/{with-different}/{params}', stubOtherPaths)).toEqual({
    higherOrderPath: '/path/{with}/{params}',
    lowerOrderPath: '/path/{with-different}/{params}',
  });
});

test('checkForPathOverlap_subPathParamsNoMatch', () => {
  expect(checkForPathOverlap('/path/{with-non-ovelapping-params}', stubOtherPaths)).toEqual(false);
  expect(checkForPathOverlap('/path/{with}/non-overlapping-params', stubOtherPaths)).toEqual(false);
  expect(checkForPathOverlap('/path/{with}/non/overlapping/params', stubOtherPaths)).toEqual(false);
});

test('checkForPathOverlap_pathMatch', () => {
  expect(checkForPathOverlap(stubOtherPaths[0].name, stubOtherPaths)).toEqual({
    higherOrderPath: stubOtherPaths[0].name,
    lowerOrderPath: stubOtherPaths[0].name,
  });
});

test('formatCFNPathParamsForExpressJs', () => {
  expect(formatCFNPathParamsForExpressJs('/')).toStrictEqual('/');
  expect(formatCFNPathParamsForExpressJs('/path')).toStrictEqual('/path');
  expect(formatCFNPathParamsForExpressJs('/path/{param}')).toStrictEqual('/path/:param');
  expect(formatCFNPathParamsForExpressJs('/path/{param}/suffix')).toStrictEqual('/path/:param/suffix');
});
