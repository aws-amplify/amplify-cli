import * as fs from 'fs-extra';
import * as path from 'path';
import { transformSync } from '@babel/core';
import babelTransformEsmToCjs from '@babel/plugin-transform-modules-commonjs';
import { Module } from 'module';

export function getAWSExportsPath(projRoot: string): string {
  return path.join(projRoot, 'src', 'aws-exports.js');
}

export function getAWSExports(projectRoot: string) {
  const awsExportsPath = getAWSExportsPath(projectRoot);
  const fileContents = fs.readFileSync(awsExportsPath, 'utf-8');
  // transpile the file contents to CommonJS
  const { code } = transformSync(fileContents, {
    plugins: [babelTransformEsmToCjs],
    configFile: false,
    babelrc: false,
  });
  const mod = new Module('aws-exports.js');
  // @ts-expect-error This is private api.
  mod._compile(code, 'aws-exports.js');
  mod.paths = [projectRoot];
  return mod.exports;
}
