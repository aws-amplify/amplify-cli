import { ExecutionContext, getCLIPath, nspawn as spawn } from '..';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

/**
 * Function to test amplify mock
 * @returns ExecutionContext the context for the mock
 */
export const amplifyMock = (cwd: string, testingWithLatestCodebase = false): ExecutionContext => {
  // Test detailed status
  return spawn(getCLIPath(testingWithLatestCodebase), ['mock'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait(/.*Are you sure you want to continue\?.*/)
    .sendYes();
};
