import readline from 'readline';

const headlessPayloadReadTimeoutMillis = 2000;

export const isHeadlessCommand = (context: any): boolean => context.input.options && context.input.options.stdin;

export const readHeadlessPayload = async (): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  const readTimeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('No input received on stdin'));
    }, headlessPayloadReadTimeoutMillis);
  });

  const readPromise: Promise<string> = new Promise(resolve => {
    rl.on('line', line => resolve(line));
  });

  return Promise.race([readTimeout, readPromise]) as Promise<string>;
};
