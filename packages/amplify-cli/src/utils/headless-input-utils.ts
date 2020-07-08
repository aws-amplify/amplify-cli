import readline from 'readline';

const headlessPayloadReadTimeoutMillis = 2000;

// checks if the --headless flag is set on the amplify command;
export const isHeadlessCommand = (context: any): boolean => context.input.options && context.input.options.headless;

// waits for a line on stdin.
// times out after the time specified above if no input received.
// this prevents the CLI from hanging forever if a customer forgets to pipe the headless payload into the command.
export const readHeadlessPayload = async (): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  // rejects a promise after an amount of time
  const readTimeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('No input received on stdin'));
    }, headlessPayloadReadTimeoutMillis);
  });

  // resolves a promise on the 'line' event
  const readPromise: Promise<string> = new Promise(resolve => {
    rl.on('line', line => resolve(line));
  });

  // wait for a line or timeout, whichever comes first
  return Promise.race([readTimeout, readPromise]) as Promise<string>;
};
