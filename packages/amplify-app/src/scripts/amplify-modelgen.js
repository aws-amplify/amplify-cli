const { spawn } = require('child_process');

/* Run codegen on base schema */

console.log('Running codegen...');

run();

async function run() {
  const isWindows = /^win/.test(process.platform);
  const amplify = process.env.AMPLIFY_PATH ? process.env.AMPLIFY_PATH : isWindows ? 'amplify.cmd' : 'amplify';
  const modelGen = spawn(amplify, ['codegen', 'model'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    shell: isWindows ? true : undefined,
  });

  modelGen.on('exit', (code) => {
    if (code === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}
