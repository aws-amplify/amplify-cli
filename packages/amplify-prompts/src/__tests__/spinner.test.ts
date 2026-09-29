import { AmplifySpinner } from '../progressbars/spinner';
import { AmplifyTerminal } from '../progressbars/terminal';

jest.mock('../progressbars/terminal');
const amplifyTerminalMocked = jest.mocked(AmplifyTerminal);

beforeEach(() => {
  jest.resetAllMocks();
});

describe('in non-TTY terminal', () => {
  beforeEach(() => {
    jest.spyOn(AmplifyTerminal.prototype, 'isTTY').mockReturnValue(false);
  });

  it('is noop', () => {
    const spinner = new AmplifySpinner();

    spinner.start('initial message');
    spinner.resetMessage('other message');
    spinner.stop('last message');

    expect(amplifyTerminalMocked.mock.instances.length).toEqual(1);
    expect(AmplifyTerminal).toHaveBeenCalledTimes(1);
    expect(amplifyTerminalMocked.mock.instances[0].writeLines).toHaveBeenCalledTimes(0);
    expect(amplifyTerminalMocked.mock.instances[0].cursor).toHaveBeenCalledTimes(0);
    expect(amplifyTerminalMocked.mock.instances[0].getLastHeight).toHaveBeenCalledTimes(0);
    expect(amplifyTerminalMocked.mock.instances[0].newLine).toHaveBeenCalledTimes(0);
  });
});

describe('in TTY terminal', () => {
  let spinner: AmplifySpinner;
  beforeEach(() => {
    jest.spyOn(AmplifyTerminal.prototype, 'isTTY').mockReturnValue(true);
    spinner = new AmplifySpinner();
  });

  afterEach(() => {
    // always stop the spinner to clear internal timer.
    spinner.stop();
  });

  it('starts spinner renders initial message, and stops spinner', async () => {
    const initialMessage = 'initial message';
    const intermediateMessage = 'intermediate message';
    const lastMessage = 'last message';
    spinner.start(initialMessage);
    spinner.resetMessage(intermediateMessage);
    // wait for default rate of 50ms plus small delta to let spinner render new message.
    await new Promise((resolve) => setTimeout(resolve, 50 + 10));
    spinner.stop(lastMessage);
    expect(amplifyTerminalMocked.mock.instances.length).toEqual(1);
    expect(AmplifyTerminal).toHaveBeenCalledTimes(1);
    expect(amplifyTerminalMocked.mock.instances[0].writeLines).toHaveBeenCalledTimes(3);
    expect(amplifyTerminalMocked.mock.instances[0].writeLines).toHaveBeenCalledWith([{ color: '', renderString: `⠋ ${initialMessage}` }]);
    expect(amplifyTerminalMocked.mock.instances[0].writeLines).toHaveBeenCalledWith([
      { color: '', renderString: `⠙ ${intermediateMessage}` },
    ]);
    expect(amplifyTerminalMocked.mock.instances[0].writeLines).toHaveBeenCalledWith([{ color: 'green', renderString: lastMessage }]);
    expect(amplifyTerminalMocked.mock.instances[0].cursor).toHaveBeenCalledTimes(2);
    expect(amplifyTerminalMocked.mock.instances[0].cursor).toHaveBeenCalledWith(false);
    expect(amplifyTerminalMocked.mock.instances[0].getLastHeight).toHaveBeenCalledTimes(0);
    expect(amplifyTerminalMocked.mock.instances[0].newLine).toHaveBeenCalledTimes(0);
  });
});
