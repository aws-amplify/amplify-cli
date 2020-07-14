const rewire = require('rewire');

const walkthrough = rewire('../awscloudformation/service-walkthroughs/apigw-walkthrough.js');

const validatePathName = walkthrough.__get__('validatePathName');
const stubOtherPaths = [{ name: '/other/path' }, { name: '/sub/path' }];

test('validatePathName_validPath', () => {
  expect(validatePathName('/some/path', stubOtherPaths)).toBe(true);
  expect(validatePathName('/path/{with}/{params}', stubOtherPaths)).toBe(true);
});

test('validatePath_empty', () => {
  expect(validatePathName('', stubOtherPaths)).toStrictEqual('The path must not be empty');
});

test('validatePathName_noLeadingSlash', () => {
  expect(validatePathName('no/leading/slash', stubOtherPaths)).toStrictEqual('The path must begin with / e.g. /items');
});

test('validatePathName_hasTrailingSlash', () => {
  expect(validatePathName('/has/trailing/slash/', stubOtherPaths)).toStrictEqual('The path must not end with /');
});

test('validatePathName_invalidCharacters', () => {
  // setup
  const errorMessage =
    'Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.';

  // test
  expect(validatePathName('/invalid+/{char}', stubOtherPaths)).toStrictEqual(errorMessage);
  expect(validatePathName('/invalid/{char@}', stubOtherPaths)).toStrictEqual(errorMessage);
  expect(validatePathName('/invalid/{param', stubOtherPaths)).toStrictEqual(errorMessage);
});

test('validatePathName_subPathMatch', () => {
  expect(validatePathName('/sub/path/match', stubOtherPaths)).toStrictEqual('An existing path already matches this sub-path: /sub/path');
});

test('validatePathName_pathMatch', () => {
  expect(validatePathName(stubOtherPaths[0].name, stubOtherPaths)).toStrictEqual(
    'An existing path already matches this sub-path: /other/path',
  );
});

test('formatCFNPathParamsForExpressJs', () => {
  // setup
  const formatCFNPathParamsForExpressJs = walkthrough.__get__('formatCFNPathParamsForExpressJs');

  // test
  expect(formatCFNPathParamsForExpressJs('/path')).toStrictEqual('/path');
  expect(formatCFNPathParamsForExpressJs('/path/{param}')).toStrictEqual('/path/:param');
  expect(formatCFNPathParamsForExpressJs('/path/{param}/suffix')).toStrictEqual('/path/:param/suffix');
});
