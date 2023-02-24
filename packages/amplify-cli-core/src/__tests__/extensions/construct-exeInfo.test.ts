import { $TSContext, toolkitExtensions } from '../..';
import * as getProjectDetails from '../../toolkit-extensions/get-project-details';
const { constructExeInfo } = toolkitExtensions;
let context_stub = {} as $TSContext;

jest.spyOn(getProjectDetails, 'getProjectDetails').mockReturnValue({} as unknown as getProjectDetails.IAmplifyProjectDetails);

describe('constructExeInfo', () => {
  beforeEach(() => {
    context_stub = {
      parameters: {
        options: {
          y: 'test',
        },
      },
    } as unknown as $TSContext;
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
