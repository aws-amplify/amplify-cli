/**
 * This script is used to merge the coverage reports from all packages into a single report.
 */
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

const getCoveragePath = (pkg: string): string => {
  return path.join('./packages', pkg, 'coverage/coverage-final.json');
};

const mergeCoverageMap = (files: string[]): istanbul.CoverageMap => {
  var map = istanbul.createCoverageMap({});
  files.forEach((file) => {
    const json = fs.readFileSync(file).toString();
    const fileCoverageMap = istanbul.createCoverageMap(JSON.parse(json));
    map.merge(fileCoverageMap);
  });
  // Remove coverage from e2e, and test files
  map.filter((file) => !file.match(/(__e2e__|__tests__)/));
  return map;
};

const writeCoverageJson = (map: istanbul.CoverageMap) => {
  const json = JSON.stringify(map);
  fs.writeFileSync(path.join(process.cwd(), './coverage/coverage-final.json'), json);
};

const generateReport = (coverage: istanbul.CoverageMap, reportType: keyof reports.ReportOptions = 'html', dir = './coverage') => {
  const context = libReport.createContext({
    dir: path.join(process.cwd(), dir),
    coverageMap: coverage,
    defaultSummarizer: 'flat',
  });
  reports.create(reportType, {}).execute(context);
};

const main = () => {
  deleteCoverageDir();
  makeCoverageDir();
  listPackages().forEach(copyPackageCoverage);
  const coveragePaths = listPackages().map(getCoveragePath).filter(fs.existsSync);
  const coverage = mergeCoverageMap(coveragePaths);
  generateReport(coverage, 'lcov', './coverage');
  writeCoverageJson(coverage);
};

main();
