const fs = require('fs');
const path = require('path');
const os = require('os');
const jest = {
  collectCoverage: true,
  coverageReporters: ['json', 'html'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testURL: 'http://localhost',
  testRegex: '(src/__tests__/.*.test\\.(js|ts))$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
const packages = './packages/';
const packagejson = 'package.json';
const dirs = fs.readdirSync(packages);

dirs.forEach(r => {
  if (fs.statSync(path.join(packages, r)).isDirectory) {
    const file = path.join(packages, r, packagejson);
    const obj = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
    if ('jest' in obj) {
      //console.log(file);
      obj['jest'].collectCoverage = true;
    } else {
      obj['jest'] = {
        ...jest,
      };
    }
    fs.writeFileSync(file, JSON.stringify(obj, null, 2) + os.EOL);
  }
});
