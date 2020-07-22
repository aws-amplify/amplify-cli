import fs from 'fs-extra';
import path from 'path';

function writeObjectAsJson(dest, obj, pretty) {
  const destPath = path.parse(dest).dir;
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  fs.writeFileSync(dest, JSON.stringify(obj, undefined, pretty ? 2 : undefined));
}

module.exports = {
  writeObjectAsJson,
};
