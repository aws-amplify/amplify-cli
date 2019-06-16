import { resolve } from 'path'
import * as fs from 'fs';
import * as path from 'path'
import generate from '../src/cliFileHandler'

describe('end 2 end tests', () => {
  const schemaPath = resolve(__dirname, '../fixtures/schema.json');
  const outputpath = resolve(__dirname, './output.graphql')
  const ops = ['mutations', 'queries', 'subscriptions']

  afterEach(() => {
    // delete the generated file
    try {
      if (fs.existsSync(outputpath) && fs.lstatSync(outputpath).isDirectory()) {
        ops.map(op => {
          fs.unlinkSync(path.join(outputpath, `${op}.graphql`));
        });
        fs.rmdirSync(outputpath);
      } else {
        fs.unlinkSync(outputpath);
      }
    } catch (e) {
      // CircleCI throws exception, no harm done if the file is not deleted
    }
  });

  it('should generate statements', () => {
    generate(schemaPath, outputpath, { separateFiles: false, maxDepth: 3, language: 'graphql' });
    const generatedOutput = fs.readFileSync(outputpath, 'utf8');
    expect(generatedOutput).toMatchSnapshot();
  });

  it('should generate statements in separate files', () => {
    if (!fs.existsSync(outputpath)) fs.mkdirSync(outputpath);
    generate(schemaPath, outputpath, { separateFiles: true, maxDepth: 3, language: 'graphql' });
    ops.map(op => {
      const generatedOutput = fs.readFileSync(path.join(outputpath, `${op}.graphql`), 'utf8');
      expect(generatedOutput).toMatchSnapshot();
    });
  });

  it('should generate statements in JS', () => {
    generate(schemaPath, outputpath, { separateFiles: false, maxDepth: 3, language: 'javascript' });
    const generatedOutput = fs.readFileSync(outputpath, 'utf8');
    expect(generatedOutput).toMatchSnapshot();
  })

  it('should generate statements in Typescript', () => {
    generate(schemaPath, outputpath, { separateFiles: false, maxDepth: 3, language: 'typescript' });
    const generatedOutput = fs.readFileSync(outputpath, 'utf8');
    expect(generatedOutput).toMatchSnapshot();
  })

  it('should generate statements in flow', () => {
    generate(schemaPath, outputpath, { separateFiles: false, maxDepth: 3, language: 'flow' });
    const generatedOutput = fs.readFileSync(outputpath, 'utf8');
    expect(generatedOutput).toMatchSnapshot();
  })
})
