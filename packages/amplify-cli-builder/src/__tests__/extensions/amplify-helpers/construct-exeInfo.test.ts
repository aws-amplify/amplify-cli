import { $TSContext } from 'amplify-cli-core';
import { constructExeInfo } from '../../../extensions/amplify-helpers/construct-exeInfo';
let context_stub = {} as $TSContext;

jest.mock('../../../extensions/amplify-helpers/get-project-details', () => ({
  getProjectDetails: jest.fn().mockReturnValue({}),
}));

describe('constructExeInfo', () => {
  beforeEach(() => {
    context_stub = {
      parameters: {
        options: {
          y: 'test',
        },
      },
    } as $TSContext;
  });
  it('should return normalised inputParams', () => {
    const expected = Object.assign(
      {
        exeInfo: {
          inputParams: {
            yes: 'test',
          },
        },
      },
      context_stub,
    );
    constructExeInfo(context_stub);
    expect(context_stub).toStrictEqual(expected);
  });
});
