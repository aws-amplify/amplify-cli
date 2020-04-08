import { isProjectNameValid, normalizeProjectName } from '../../../extensions/amplify-helpers/project-name-validation';

// valid
const lowercaseProjectName = 'project';
const uppercaseProjectName = 'PROJECT';
const mixedProjectName = 'pRoJEct';
const alphanumeric = 'projectName1';

// invalid
const tooShort = 'hi';
const tooLong = 'thisProjectNameIsTooLong';
const hyphenated = 'project-name-1';
const nonAlphanumeric = 'not*a$project%';

test('isProjectNameValid', () => {
  // valid
  expect(isProjectNameValid(lowercaseProjectName)).toBeTruthy();
  expect(isProjectNameValid(uppercaseProjectName)).toBeTruthy();
  expect(isProjectNameValid(mixedProjectName)).toBeTruthy();
  expect(isProjectNameValid(alphanumeric)).toBeTruthy();
  // invalid
  expect(isProjectNameValid(tooShort)).toBeFalsy();
  expect(isProjectNameValid(tooLong)).toBeFalsy();
  expect(isProjectNameValid(hyphenated)).toBeFalsy();
  expect(isProjectNameValid(nonAlphanumeric)).toBeFalsy();
});

test('normalizeProjectName', () => {
  expect(normalizeProjectName(alphanumeric)).toBe(alphanumeric);
  expect(isProjectNameValid(normalizeProjectName(tooShort))).toBeTruthy();
  expect(normalizeProjectName(tooLong)).toBe('thisProjectNameIsToo');
  expect(normalizeProjectName(hyphenated)).toBe('projectname1');
  expect(normalizeProjectName(nonAlphanumeric)).toBe('notaproject');
});
