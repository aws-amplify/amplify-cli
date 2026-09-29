const fs = require('fs-extra');
const path = require('path');
const localTemplatePath = path.resolve(__dirname, '../dist/index.html');

const getShortNameForTestSuite = (testSuitePath) => {
  let startIndex = testSuitePath.lastIndexOf('/') + 1;
  if (testSuitePath.startsWith('C:')) {
    // windows
    startIndex = testSuitePath.lastIndexOf('\\') + 1;
  }
  const endIndex = testSuitePath.lastIndexOf('.test');
  return testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
};

function imgToBase64(imgPath) {
  const fileName = path.resolve(imgPath);
  if (fs.statSync(fileName).isFile()) {
    const fileData = fs.readFileSync(fileName).toString('base64');
    return `data:image/${fileName.split('.').pop()};base64,${fileData}`;
  }
  return undefined;
}

const filterBlock = (blocks) => blocks.filter((block) => block.logs.length);
const getLogs = (blocks) => filterBlock(blocks).reduce((sum, b) => [...sum, ...b.logs], []);
const mergeCliLog = (result, logs, ancestorTitles = [], prefix = '') => {
  let before = [];
  let after = [];
  let children = [];
  if (ancestorTitles.length) {
    const describeBlockName = ancestorTitles[0];
    const describeBlock = logs.find((l) => l.type === 'describe' && l.name === describeBlockName);
    if (describeBlock) {
      const prefixStr = prefix ? `${prefix} -> ${describeBlockName}` : describeBlockName;
      if (describeBlock.hooks.beforeAll) {
        before = getLogs(describeBlock.hooks.beforeAll).map((bfa) => ({ ...bfa, name: `${prefixStr} -> BeforeAll` }));
      }
      children = mergeCliLog(result, describeBlock.children, ancestorTitles.slice(1), prefixStr);
      if (describeBlock.hooks.afterAll) {
        after = getLogs(describeBlock.hooks.afterAll).map((afa) => ({ ...afa, name: `${prefixStr} --> AfterAll` }));
      }
    }
  } else {
    const testBlock = logs.find((l) => l.type === 'test' && l.name === result.title);
    if (testBlock) {
      const prefixStr = prefix ? `${prefix} -> ${testBlock.name}` : testBlock.name;

      if (testBlock.hooks.beforeEach) {
        before = getLogs(testBlock.hooks.beforeEach).map((bfe) => ({ ...bfe, name: `${prefixStr} -> BeforeEach` }));
      }

      if (filterBlock([testBlock]).length) {
        children = testBlock.logs.map((log) => ({ ...log, name: prefixStr }));
      }
      if (testBlock.hooks.afterEach) {
        after = getLogs(testBlock.hooks.afterEach).map((afe) => ({ ...afe, name: `${prefixStr} --> AfterEach` }));
      }
    }
  }

  return [...before, ...children, ...after];
};

class AmplifyCLIExecutionReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const { publicPath = process.cwd(), filename = 'jest_html_reporters.html', logoImgPath } = this._options;
    const logoImg = logoImgPath ? imgToBase64(logoImgPath) : undefined;
    fs.ensureDirSync(publicPath);

    const processedResults = results.testResults.map((result) => {
      const testName = getShortNameForTestSuite(result.testFilePath);
      // result is Array of TestResult: https://github.com/facebook/jest/blob/ac57282299c383320845fb9a026719de7ed3ee5e/packages/jest-test-result/src/types.ts#L90
      const resultCopy = { ...result };
      delete resultCopy.CLITestRunner;
      return {
        ...resultCopy,
        // each test result has an array of 'AssertionResult'
        testResults: result.testResults.map((r) => {
          const recordings = mergeCliLog(r, result.CLITestRunner.logs.children, r.ancestorTitles);

          const recordingWithPath = recordings.map((r, index) => {
            // the first command is always 'amplify', but r.cmd is the full path to the cli.. so this is more readable
            const commandAndParams = ['amplify'];
            if (r.params) {
              commandAndParams.push(
                ...r.params.map((p) => {
                  if (p.length > 2 && p.startsWith('C:')) {
                    return ''; // windows - skip this param because its the full amplify exe path
                  }
                  return p;
                }),
              );
            }
            const sanitizedSections = [];
            for (const section of commandAndParams) {
              // this ensures only alphanumeric values are in the file name
              sanitizedSections.push(section.replace(/[^a-z0-9]/gi, '_').toLowerCase());
            }
            let suffix = sanitizedSections.join('_');
            if (suffix.length > 20) {
              suffix = suffix.substring(0, 20);
            }
            const castFile = `${testName}_${index}_${suffix}.cast`;
            const castFilePath = path.join(publicPath, castFile);
            fs.writeFileSync(castFilePath, r.recording);
            const rCopy = { ...r };
            delete rCopy.recording;
            return {
              ...rCopy,
              castFile: `./${castFile}`,
            };
          });
          return {
            ...r,
            recordings: recordingWithPath,
          };
        }),
      };
    });
    const resultsWithRecordings = {
      ...results,
      testResults: processedResults,
    };
    resultsWithRecordings.config = this._globalConfig;
    resultsWithRecordings.endTime = Date.now();
    resultsWithRecordings._reporterOptions = { ...this._options, logoImg, customInfos: {} };
    const data = JSON.stringify(resultsWithRecordings);

    const filePath = path.resolve(publicPath, filename);
    // const filePathMock = path.resolve(publicPath, `devMock.json`);
    // fs.writeFileSync(filePathMock, data);
    const htmlTemplate = fs.readFileSync(localTemplatePath, 'utf-8');
    const outPutContext = htmlTemplate.replace('$resultData', JSON.stringify(data));
    fs.writeFileSync(filePath, outPutContext, 'utf-8');
    console.log('📦 reporter is created on:', filePath);
  }
}

module.exports = AmplifyCLIExecutionReporter;
