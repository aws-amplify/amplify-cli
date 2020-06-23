import fs from 'fs-extra';
import path from 'path';

function writeJsonToDart(dest, obj, pretty) {
  const destPath = path.parse(dest).dir;
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  const dartContent = `const amplifyconfig = ''' ${obj}''';`;
  fs.writeFileSync(dest, dartContent);
}

module.exports = {
  writeJsonToDart,
};
