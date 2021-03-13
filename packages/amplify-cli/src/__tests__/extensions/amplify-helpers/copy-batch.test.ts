import { copyBatch } from '../../../extensions/amplify-helpers/copy-batch';
import { JSONUtilities, $TSContext, $TSCopyJob } from 'amplify-cli-core';

let exists = false;

jest.mock('amplify-cli-core');

const context_stub = ({
  prompt: {
    confirm: jest.fn(),
  },
  filesystem: {
    exists: () => exists,
  },
  template: {
    generate: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;
const jobs_stub = ([
  {
    target: 'test',
    dir: 'test',
    template: 'test',
    paramsFile: 'test',
  },
] as unknown) as jest.Mocked<$TSCopyJob>;

describe('copyBatch', () => {
  beforeEach(() => {
    exists = false;
  });
  it('should do nothing when job is empty', async () => {
    await copyBatch(context_stub, [false], {}, false, true);
    expect(JSONUtilities.writeJson).not.toBeCalled();
  });
  it('should confirm when file exists', async () => {
    exists = true;
    await copyBatch(context_stub, jobs_stub, {}, false, false);
    expect(JSONUtilities.writeJson).not.toBeCalled();
  });
  it('should copy provided writeParams', async () => {
    await copyBatch(context_stub, jobs_stub, {}, false, true);
    expect(JSONUtilities.writeJson).toBeCalled();
  });
});
