import generateOperation from '../../src/generator/generateOperation';
import getArgs from '../../src/generator/getArgs';
import getBody from '../../src/generator/getBody';
import { GQLDocsGenOptions } from '../../src/generator/types';

jest.mock('../../src/generator/getArgs');
jest.mock('../../src/generator/getBody');

const maxDepth = 4;
const generateOption: GQLDocsGenOptions = { useExternalFragmentForS3Object: true };
describe('generateOperation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getArgs.mockReturnValue(['MOCK_ARG']);
    getBody.mockReturnValue('MOCK_BODY');
  });

  it('should generate operation', () => {
    const op = {
      args: ['arg1'],
    };
    const doc = 'MOCK_DOCUMENT';
    expect(generateOperation(op, 'MOCK_DOCUMENT', maxDepth, generateOption)).toEqual({
      args: ['MOCK_ARG'],
      body: 'MOCK_BODY',
    });

    expect(getArgs).toHaveBeenCalledWith(op.args);
    expect(getBody).toBeCalledWith(op, doc, maxDepth, generateOption);
  });
});
