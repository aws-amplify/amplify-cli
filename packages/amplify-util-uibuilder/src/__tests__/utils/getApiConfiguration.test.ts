import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { relativeToComponentsPath } from '../../commands/utils/getApiConfiguration';
import { getUiBuilderComponentsPath } from '../../commands/utils/getUiBuilderComponentsPath';
import path from 'path';

jest.mock('../../commands/utils/getUiBuilderComponentsPath', () => ({
  ...jest.requireActual('../../commands/utils/getUiBuilderComponentsPath'),
  getUiBuilderComponentsPath: jest.fn(),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
}));

const pathMocked = path as any;

const getUiBuilderComponentsPathMocked = getUiBuilderComponentsPath as any;

describe('relativeToComponentsPath', () => {
  it('should return posix relative path when run in a windows-like environment', () => {
    pathMocked.relative = path.win32.relative;
    pathMocked.sep = path.win32.sep;
    const projectPath = 'c:\\dev\\test\\test-project';
    const toImport = projectPath + '\\src\\graphql\\queries.js';
    getUiBuilderComponentsPathMocked.mockReturnValue(projectPath + '\\src\\ui-components');

    const response = relativeToComponentsPath(toImport, {} as $TSContext);

    expect(response).toBe('../graphql/queries.js');
  });

  it('should return expected relative path', () => {
    const projectPath = '/dev/test/test-project';
    const toImport = projectPath + '/src/graphql/queries.js';
    getUiBuilderComponentsPathMocked.mockReturnValue(projectPath + '/src/ui-components');

    const response = relativeToComponentsPath(toImport, {} as $TSContext);

    expect(response).toBe('../graphql/queries.js');
  });
});
