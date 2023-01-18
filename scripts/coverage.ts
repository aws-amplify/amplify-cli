import * as fs from 'fs';
import * as path from 'path';
import * as istanbul from 'istanbul-lib-coverage';
import * as libReport from 'istanbul-lib-report';
import * as reports from 'istanbul-reports';

const deleteCoverageDir = () => {
  fs.rmdirSync(path.join(process.cwd(), './coverage'), { recursive: true });
};

const makeCoverageDir = () => {
  fs.mkdirSync(path.join(process.cwd(), './coverage/workspaces'), { recursive: true });
};

const listPackages = () => {
  const packages = fs.readdirSync(path.join(process.cwd(), './packages'));
  return packages;
};

const copyPackageCoverage = (pkg: string) => {
  const coverageFile = path.join(process.cwd(), `./packages/${pkg}/coverage/coverage-final.json`);
  if (fs.existsSync(coverageFile)) {
    const target = path.join(process.cwd(), `./coverage/workspaces/${pkg}-coverage-final.json`);
    fs.copyFileSync(coverageFile, target);
  }
};

const getCoverageFiles = () => {
  const files = fs.readdirSync(path.join(process.cwd(), './coverage/workspaces'));
  return files.map(f => path.join(process.cwd(), `./coverage/workspaces/${f}`));
};

const mergeCoverageMap = (files: string[]): istanbul.CoverageMap => {
  var map = istanbul.createCoverageMap({});
  files.forEach(file => {
    const json = fs.readFileSync(file).toString();
    map.merge(JSON.parse(json));
  });
  return map;
};

const writeCoverageJson = (map: istanbul.CoverageMap) => {
  const json = JSON.stringify(map);
  fs.writeFileSync(path.join(process.cwd(), './coverage/monorepo-coverage.json'), json);
};

const generateReport = (coverage: istanbul.CoverageMap) => {
  const context = libReport.createContext({
    dir: path.join(process.cwd(), './coverage/html'),
    defaultSummarizer: 'pkg',
    coverageMap: coverage,
  });
  reports.create('html-spa', {}).execute(context);
};

const main = () => {
  deleteCoverageDir();
  makeCoverageDir();
  listPackages().forEach(copyPackageCoverage);
  const coverage = mergeCoverageMap(getCoverageFiles());
  generateReport(coverage);
  writeCoverageJson(coverage);
};

main();
