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

  // closes the readline after an amount of time
  const id = setTimeout(() => {
    clearTimeout(id);
    rl.close();
  }, headlessPayloadReadTimeoutMillis);

  // resolves a promise on the 'line' event
  return new Promise((resolve, reject) => {
    rl.on('line', line => resolve(line));
    rl.on('close', () => reject(new Error('No input received on stdin')));
  });
};
