const fs = require('fs');
const path = require('path');

async function run(context) {
  context.print.info(require(path.join(__dirname, '..', 'package.json')).version);
}

module.exports = {
  run,
};
