import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { loadSchema, loadAndMergeQueryDocuments } from './loading';
import { validateQueryDocument } from './validation';
import { compileToIR } from './compiler';
import { compileToLegacyIR } from './compiler/legacyIR';
import serializeToJSON from './serializeToJSON';
import { BasicGeneratedFile } from './utilities/CodeGenerator';
import { generateSource as generateSwiftSource } from './swift';
import { generateSource as generateTypescriptSource } from './typescript';
import { generateSource as generateFlowSource } from './flow';
import { generateSource as generateFlowModernSource } from './flow-modern';
import { generateSource as generateScalaSource } from './scala';
import { generateSource as generateAngularSource } from './angular';
import { hasS3Fields } from './utilities/complextypes';

type TargetType = 'json' | 'swift' | 'ts' | 'typescript' | 'flow' | 'scala' | 'flow-modern' | 'angular';

export default function generate(
  inputPaths: string[],
  schemaPath: string,
  outputPath: string,
  only: string,
  target: TargetType,
  tagName: string,
  options: any
) {
  const schema = loadSchema(schemaPath);

  const document = loadAndMergeQueryDocuments(inputPaths, tagName);

  validateQueryDocument(schema, document);

  if (target === 'swift') {
    options.addTypename = true;
    const context = compileToIR(schema, document, options);
    // Complex object suppport
    if (options.complexObjectSupport === 'auto') {
      options.addS3Wrapper = context.typesUsed.some(typesUsed => hasS3Fields(typesUsed));
    } else if (options.complexObjectSupport === 'yes') {
      options.addS3Wrapper = true;
    } else {
      options.addS3Wrapper = false;
    }
    const outputIndividualFiles = fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory();

    const generator = generateSwiftSource(context, outputIndividualFiles, only);

    if (outputIndividualFiles) {
      writeGeneratedFiles(generator.generatedFiles, outputPath);
    } else {
      fs.writeFileSync(outputPath, generator.output);
    }
  } else if (target === 'flow-modern') {
    const context = compileToIR(schema, document, options);
    const generatedFiles = generateFlowModernSource(context);

    // Group by output directory
    const filesByOutputDirectory: {
      [outputDirectory: string]: {
        [fileName: string]: BasicGeneratedFile;
      };
    } = {};

    Object.keys(generatedFiles).forEach((filePath: string) => {
      const outputDirectory = path.dirname(filePath);
      if (!filesByOutputDirectory[outputDirectory]) {
        filesByOutputDirectory[outputDirectory] = {
          [path.basename(filePath)]: generatedFiles[filePath],
        };
      } else {
        filesByOutputDirectory[outputDirectory][path.basename(filePath)] = generatedFiles[filePath];
      }
    });

    Object.keys(filesByOutputDirectory).forEach(outputDirectory => {
      writeGeneratedFiles(filesByOutputDirectory[outputDirectory], outputDirectory);
    });
  } else {
    let output;
    const context = compileToLegacyIR(schema, document, options);
    switch (target) {
      case 'json':
        output = serializeToJSON(context);
        break;
      case 'ts':
      case 'typescript':
        output = generateTypescriptSource(context);
        break;
      case 'flow':
        output = generateFlowSource(context);
        break;
      case 'scala':
        output = generateScalaSource(context, options);
        break;
      case 'angular':
        output = generateAngularSource(context);
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, output);
    } else {
      console.log(output);
    }
  }
}

function writeGeneratedFiles(generatedFiles: { [fileName: string]: BasicGeneratedFile }, outputDirectory: string) {
  // Clear all generated stuff to make sure there isn't anything
  // unnecessary lying around.
  rimraf.sync(outputDirectory);
  // Remake the output directory
  fs.mkdirSync(outputDirectory);

  for (const [fileName, generatedFile] of Object.entries(generatedFiles)) {
    fs.writeFileSync(path.join(outputDirectory, fileName), generatedFile.output);
  }
}
