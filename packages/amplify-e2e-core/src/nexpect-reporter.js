const fs = require('fs-extra');
const path = require('path');
const uuid = require('uuid');
const localTemplatePath = path.resolve(__dirname, '../dist/index.html');

function imgToBase64(imgPath) {
  const fileName = path.resolve(imgPath);
  if (fs.statSync(fileName).isFile()) {
    const fileData = fs.readFileSync(fileName).toString('base64');
    return `data:image/${fileName.split('.').pop()};base64,${fileData}`;
  }
  return undefined;
}

const filterBlock = blocks => blocks.filter(block => block.logs.length);
const getLogs = blocks => filterBlock(blocks).reduce((sum, b) => [...sum, ...b.logs], []);
const mergeCliLog = (result, logs, ancestorTitles = [], prefix = '') => {
  let before = [];
  let after = [];
  let children = [];
  if (ancestorTitles.length) {
    const describeBlockName = ancestorTitles[0];
    const describeBlock = logs.find(l => l.type === 'describe' && l.name === describeBlockName);
    if (describeBlock) {
      const prefixStr = prefix ? `${prefix} -> ${describeBlockName}` : describeBlockName;
      if (describeBlock.hooks.beforeAll) {
        before = getLogs(describeBlock.hooks.beforeAll).map(bfa => ({ ...bfa, name: `${prefixStr} -> BeforeAll` }));
      }
      children = mergeCliLog(result, describeBlock.children, ancestorTitles.slice(1), prefixStr);
      if (describeBlock.hooks.afterAll) {
        after = getLogs(describeBlock.hooks.afterAll).map(afa => ({ ...afa, name: `${prefixStr} --> AfterAll` }));
      }
    }
  } else {
    const testBlock = logs.find(l => l.type === 'test' && l.name === result.title);
    if (testBlock) {
      const prefixStr = prefix ? `${prefix} -> ${testBlock.name}` : testBlock.name;

      if (testBlock.hooks.beforeEach) {
        before = getLogs(testBlock.hooks.beforeEach).map(bfe => ({ ...bfe, name: `${prefixStr} -> BeforeEach` }));
      }

      if (filterBlock([testBlock]).length) {
        children = testBlock.logs.map(log => ({ ...log, name: prefixStr }));
      }
      if (testBlock.hooks.afterEach) {
        after = getLogs(testBlock.hooks.afterEach).map(afe => ({ ...afe, name: `${prefixStr} --> AfterEach` }));
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

    const processedResults = results.testResults.map(result => {
      const resultCopy = { ...result };
      delete resultCopy.CLITestRunner;
      return {
        ...resultCopy,
        testResults: result.testResults.map(r => {
          const recordings = mergeCliLog(r, result.CLITestRunner.logs.children, r.ancestorTitles);

          const recordingWithPath = recordings.map(r => {
            const castFile = `${uuid.v4()}.cast`;
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
