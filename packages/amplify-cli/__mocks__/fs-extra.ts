const fs: any = jest.genMockFromModule('fs-extra');

fs.readdirSync = jest.fn().mockReturnValue(['file1', 'file2']);
fs.readFileSync = jest.fn().mockReturnValue({});
fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => {} });
fs.unlinkSync = jest.fn().mockReturnValue(null);
fs.copySync = jest.fn().mockReturnValue({});

module.exports = fs;
