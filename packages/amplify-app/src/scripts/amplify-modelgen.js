const { spawn } = require('child_process');

/* Run codegen on base schema */

console.log('Running codegen...');

run();

async function run() {
  const amplify = /^win/.test(process.platform) ? 'amplify.cmd' : 'amplify';
  const modelGen = spawn(amplify, ['codegen', 'model'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

  modelGen.on('exit', code => {
    if (code === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}
