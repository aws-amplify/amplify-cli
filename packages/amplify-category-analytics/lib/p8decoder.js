const fs = require('fs-extra');

function run(filaPath) {
  let content = fs.readFileSync(filaPath, 'utf8');
  content = content.replace(/-----.*-----/gi, '').replace(/\s/g, '');
  return content.trim();
}

module.exports = {
  run,
};
