import readline from 'readline';

export const getHeadlessInput = async (): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  return new Promise(resolve => {
    rl.on('line', line => resolve(line));
  });
};
