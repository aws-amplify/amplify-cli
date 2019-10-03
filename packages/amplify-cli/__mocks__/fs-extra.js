const fsExtra = jest.genMockFromModule('fs-extra');


function copySync() {
  return {};
}

fsExtra.copySync = copySync;

module.exports = fsExtra;
