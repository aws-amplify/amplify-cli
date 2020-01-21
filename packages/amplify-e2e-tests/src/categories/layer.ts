import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addLayer(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'layer'], { cwd, stripColors: true, verbose })
      .wait('Provide a friendly name for your resource to be used as a label')
      .sendline('\r')
      .wait('Provide the AWS Lambda layer name')
      .sendline('\r')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function layerBuild(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['layer', 'build'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue building the resources?')
      .sendline('Y')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
