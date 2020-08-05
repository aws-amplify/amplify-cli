const fs = jest.genMockFromModule('fs-extra');

function copySync() {
  return {};
}

function readdirSync() {
  return ['file1', 'file2'];
}

function unlinkSync() {
  return null;
}

function readFileSync() {
  return {};
}

function statSync() {
  return { isDirectory: () => {} };
}

fs.readdirSync = readdirSync;
fs.readFileSync = readFileSync;
fs.statSync = statSync;
fs.unlinkSync = unlinkSync;
fs.copySync = copySync;

module.exports = fs;
