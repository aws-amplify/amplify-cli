const fs = require('fs-extra');
const path = require('path');

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
class FailedTestNameReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const failedTests = this.getFailedTestRegEx(results);
    const result = failedTests.map((title) => escapeRegex(title)).join('|');
    const failedTestReportPath = this._options.reportPath || './amplify-e2e-reports/amplify-e2e-failed-test.txt';
    fs.writeFileSync(path.resolve(failedTestReportPath), result);
  }

  getFailedTestRegEx(results) {
    let failedTestNames = [];
    if (results.testResults) {
      for (const result of results.testResults) {
        failedTestNames = [...failedTestNames, ...this.getFailedTestRegEx(result)];
      }
    } else if (results.status === 'failed') {
      failedTestNames.push(results.title);
    }

    return failedTestNames;
  }
}

module.exports = FailedTestNameReporter;
